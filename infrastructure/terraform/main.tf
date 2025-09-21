###############################################
# Main Terraform configuration for Chatbot App
# - S3 Bucket: frontend + static data
# - Lambda Functions: backend logic
# - API Gateway: public API exposure
###############################################

###############################################
# S3 FRONTEND + STATIC DATA
###############################################

# Bucket for hosting frontend and activities data
resource "aws_s3_bucket" "activity_bucket" {
  bucket        = var.s3_bucket_name
  force_destroy = true # Allow bucket destroy even if objects exist
}

# Upload activities JSON (used by Lambda backend)
resource "aws_s3_object" "activities_json" {
  bucket       = aws_s3_bucket.activity_bucket.id
  key          = "activities.json"
  source       = "${path.module}/../../data/activities_real.json"
  etag         = filemd5("${path.module}/../../data/activities_real.json")
  content_type = "application/json"
}

# Upload tags JSON (used by backend search)
resource "aws_s3_object" "tags_json" {
  bucket       = aws_s3_bucket.activity_bucket.id
  key          = "unique_tags.json"
  source       = "${path.module}/../../data/unique_tags.json"
  etag         = filemd5("${path.module}/../../data/unique_tags.json")
  content_type = "application/json"
}

# Build frontend (React + Static SEO Pages)
resource "null_resource" "frontend_build" {
  provisioner "local-exec" {
    working_dir = "${path.module}/../../frontend"
    command     = "npm install && REACT_APP_GA_MEASUREMENT_ID=${var.google_analytics_measurement_id} npm run build"
  }
  # Rebuild only when frontend source files change
  triggers = {
    src_hash = sha256(join("", [
      for f in fileset("${path.module}/../../frontend/src", "**/*")
      : filesha256("${path.module}/../../frontend/src/${f}")
    ]))
    scripts_hash = sha256(join("", [
      for f in fileset("${path.module}/../../frontend/scripts", "**/*")
      : filesha256("${path.module}/../../frontend/scripts/${f}")
    ]))
    data_hash              = filesha256("${path.module}/../../data/activities_real.json")
    package_json           = filesha256("${path.module}/../../frontend/package.json")
    package_lock           = filesha256("${path.module}/../../frontend/package-lock.json")
    ga_measurement_id      = var.google_analytics_measurement_id
  }
}

# Upload built frontend files
resource "aws_s3_object" "frontend_files" {
  depends_on = [null_resource.frontend_build]
  for_each   = fileset("${path.module}/../../frontend/build", "**/*")
  
  bucket       = aws_s3_bucket.activity_bucket.id
  key          = each.key
  source       = "${path.module}/../../frontend/build/${each.key}"
  etag         = filemd5("${path.module}/../../frontend/build/${each.key}")
  content_type = lookup(local.mime_types,
    length(regexall("\\.[^.]+$", each.key)) > 0 ? regexall("\\.[^.]+$", each.key)[0] : "",
    "application/octet-stream"
  )

  # Add triggers to ensure files are re-uploaded when frontend changes
  lifecycle {
    replace_triggered_by = [
      null_resource.frontend_build
    ]
  }
}

# Runtime config (so frontend can call API dynamically)
resource "aws_s3_object" "frontend_config" {
  depends_on = [null_resource.frontend_build, aws_apigatewayv2_stage.default]

  bucket       = aws_s3_bucket.activity_bucket.id
  key          = "config.json"
  content      = <<EOF
{ "API_BASE_URL": "${aws_apigatewayv2_api.api.api_endpoint}" }
EOF
  content_type = "application/json"
  acl          = "public-read"
}

# File extension → MIME type mapping
locals {
  mime_types = {
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".ico"  = "image/x-icon"
    ".svg"  = "image/svg+xml"
  }
}

# Website hosting config
resource "aws_s3_bucket_website_configuration" "activity_bucket_website" {
  bucket = aws_s3_bucket.activity_bucket.id
  index_document { suffix = "index.html" }
  error_document { key    = "error.html" }
}

# ✅ S3 CORS: allow frontend to fetch JSON and static files
resource "aws_s3_bucket_cors_configuration" "activity_bucket_cors" {
  bucket = aws_s3_bucket.activity_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "POST"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

# Bucket ownership & ACL (public website hosting)
resource "aws_s3_bucket_ownership_controls" "activity_bucket_ownership" {
  bucket = aws_s3_bucket.activity_bucket.id
  rule { object_ownership = "BucketOwnerPreferred" }
}

resource "aws_s3_bucket_acl" "activity_bucket_acl" {
  depends_on = [aws_s3_bucket_ownership_controls.activity_bucket_ownership]
  bucket     = aws_s3_bucket.activity_bucket.id
  acl        = "public-read"
}

# Public access configuration
resource "aws_s3_bucket_public_access_block" "activity_bucket_public_access" {
  bucket = aws_s3_bucket.activity_bucket.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

###############################################
# CLOUDFRONT DISTRIBUTION FOR PERFORMANCE & SEO
###############################################

# CloudFront Origin Access Control for S3 (only if CloudFront enabled)
resource "aws_cloudfront_origin_access_control" "s3_oac" {
  count                             = var.enable_cloudfront ? 1 : 0
  name                              = "activity-bucket-oac"
  description                       = "OAC for activity bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution (only for production/staging)
resource "aws_cloudfront_distribution" "activity_distribution" {
  count      = var.enable_cloudfront ? 1 : 0
  depends_on = [aws_s3_object.frontend_files]

  origin {
    domain_name              = aws_s3_bucket.activity_bucket.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.activity_bucket.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3_oac[0].id
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  # Cache behavior for React app (index.html)
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.activity_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600    # 1 hour
    max_ttl                = 86400   # 24 hours
  }

  # Cache behavior for static activity pages (better SEO caching)
  ordered_cache_behavior {
    path_pattern     = "activities/*.html"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.activity_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400   # 24 hours for SEO pages
    max_ttl                = 604800  # 7 days
  }

  # Cache behavior for static assets (CSS, JS, images)
  ordered_cache_behavior {
    path_pattern     = "static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.activity_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400   # 24 hours
    default_ttl            = 604800  # 7 days
    max_ttl                = 31536000 # 1 year
  }

  # Handle SPA routing - redirect 404s to index.html
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "Activity Database Distribution"
  }
}

# S3 bucket policy - conditional based on CloudFront usage
resource "aws_s3_bucket_policy" "activity_bucket_policy" {
  depends_on = [aws_s3_bucket_public_access_block.activity_bucket_public_access]
  bucket = aws_s3_bucket.activity_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      var.enable_cloudfront ? [
        {
          Effect = "Allow"
          Principal = {
            Service = "cloudfront.amazonaws.com"
          }
          Action   = "s3:GetObject"
          Resource = "${aws_s3_bucket.activity_bucket.arn}/*"
          Condition = {
            StringEquals = {
              "AWS:SourceArn" = aws_cloudfront_distribution.activity_distribution[0].arn
            }
          }
        }
      ] : [],
      [
        {
          Effect    = "Allow"
          Principal = "*"
          Action    = "s3:GetObject"
          Resource  = "${aws_s3_bucket.activity_bucket.arn}/*"
        }
      ]
    )
  })
}

###############################################
# IAM ROLES + POLICIES FOR LAMBDA
###############################################

# Execution role
resource "aws_iam_role" "lambda_execution_role" {
  name = "activity_database_lambda_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# Attach AWS basic Lambda execution permissions (logs, etc.)
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Policy to allow Lambda access to S3 bucket data
resource "aws_iam_policy" "lambda_s3_access" {
  name        = "activity_database_lambda_s3_access"
  description = "Allow Lambda functions to access S3 bucket"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.activity_bucket.arn}/*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3_access_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_s3_access.arn
}

###############################################
# LAMBDA FUNCTIONS
###############################################

# Package definitions
data "archive_file" "query_processor_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../backend/functions/query_processor"
  output_path = "${path.module}/../../backend/deployments/query_processor.zip"
  excludes    = ["__pycache__"]
}

data "archive_file" "search_engine_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../backend/functions/search_engine"
  output_path = "${path.module}/../../backend/deployments/search_engine.zip"
  excludes    = ["__pycache__"]
}

data "archive_file" "result_enhancer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../backend/functions/result_enhancer"
  output_path = "${path.module}/../../backend/deployments/result_enhancer.zip"
  excludes    = ["__pycache__"]
}

# Create Lambda Layer ZIP from requirements
resource "null_resource" "build_lambda_layer" {
  triggers = {
    requirements_hash = filesha256("${path.module}/../../backend/requirements.txt")
    utils_hash = filesha256("${path.module}/../../backend/functions/utils.py")
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../../backend"
    command     = "bash create_zip_file.sh"
  }
  
}

# Create Lambda Layer for dependencies
resource "aws_lambda_layer_version" "dependencies" {
  depends_on = [null_resource.build_lambda_layer]
  filename         = "${path.module}/../../backend/deployments/lambda_layer.zip"
  layer_name       = "activity_database_dependencies"
  description      = "Dependencies for Activity Database Lambda functions"
  compatible_runtimes = ["python3.10"]
  
  # Add source code hash to detect changes in the layer ZIP
  source_code_hash = filebase64sha256("${path.module}/../../backend/deployments/lambda_layer.zip")
  
  lifecycle {
    create_before_destroy = true
    # Force replacement when the build changes
    replace_triggered_by = [
      null_resource.build_lambda_layer
    ]
  }
}

# Lambda: Query Processor
resource "aws_lambda_function" "query_processor_function" {
  function_name    = "activity-database-query-processor"
  filename         = data.archive_file.query_processor_zip.output_path
  source_code_hash = data.archive_file.query_processor_zip.output_base64sha256
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.10"  # Latest stable AWS Lambda Python runtime
  timeout          = 10
  memory_size      = 256
  environment {
    variables = { 
      OPENAI_API_KEY = var.openai_api_key
      TAGS_BUCKET_NAME = aws_s3_bucket.activity_bucket.id
      TAGS_FILE_KEY = "unique_tags.json"
    }
  }

  # Add Lambda Layers for dependencies
  layers = [aws_lambda_layer_version.dependencies.arn]
}

# Lambda: Search Engine
resource "aws_lambda_function" "search_engine_function" {
  function_name    = "activity-database-search-engine"
  filename         = data.archive_file.search_engine_zip.output_path
  source_code_hash = data.archive_file.search_engine_zip.output_base64sha256
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.10"
  timeout          = 10
  memory_size      = 256
  environment {
    variables = {
      ACTIVITIES_BUCKET_NAME = aws_s3_bucket.activity_bucket.id
      ACTIVITIES_FILE_KEY    = "activities.json"
    }
  }

  # Add Lambda Layers for dependencies
  layers = [aws_lambda_layer_version.dependencies.arn]
}

# Lambda: Result Enhancer
resource "aws_lambda_function" "result_enhancer_function" {
  function_name    = "activity-database-result-enhancer"
  filename         = data.archive_file.result_enhancer_zip.output_path
  source_code_hash = data.archive_file.result_enhancer_zip.output_base64sha256
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.10"
  timeout          = 10
  memory_size      = 256
  environment {
    variables = { OPENAI_API_KEY = var.openai_api_key }
  }

  # Add Lambda Layers for dependencies
  layers = [aws_lambda_layer_version.dependencies.arn]
}

###############################################
# API GATEWAY (HTTP API)
###############################################

resource "aws_apigatewayv2_api" "api" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  # ✅ CORS config: allows frontend and local dev to call APIs
  cors_configuration {
    allow_origins = [
      "http://${aws_s3_bucket_website_configuration.activity_bucket_website.website_endpoint}",
      "https://${aws_s3_bucket_website_configuration.activity_bucket_website.website_endpoint}",
      "http://localhost:3000",
      "http://localhost:5550",
      "*"
    ]
    allow_methods = ["POST", "OPTIONS", "GET"]
    allow_headers = ["content-type", "authorization", "x-amz-date", "x-api-key", "x-amz-security-token"]
    expose_headers = ["content-length", "date"]
    max_age       = 300
  }
}

# Integrations
resource "aws_apigatewayv2_integration" "query_processor_integration" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.query_processor_function.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_integration" "search_engine_integration" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.search_engine_function.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_integration" "result_enhancer_integration" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.result_enhancer_function.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Routes
resource "aws_apigatewayv2_route" "query_processor_route" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /process-query"
  target    = "integrations/${aws_apigatewayv2_integration.query_processor_integration.id}"
}

# Update the OPTIONS route to use the direct integration
resource "aws_apigatewayv2_route" "query_processor_route_options" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "OPTIONS /process-query"
  target    = "integrations/${aws_apigatewayv2_integration.query_processor_integration.id}"
}

resource "aws_apigatewayv2_route" "search_engine_route" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /search"
  target    = "integrations/${aws_apigatewayv2_integration.search_engine_integration.id}"
}

resource "aws_apigatewayv2_route" "search_engine_route_options" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "OPTIONS /search"
  target    = "integrations/${aws_apigatewayv2_integration.search_engine_integration.id}"
}

resource "aws_apigatewayv2_route" "result_enhancer_route" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /enhance"
  target    = "integrations/${aws_apigatewayv2_integration.result_enhancer_integration.id}"
}

resource "aws_apigatewayv2_route" "result_enhancer_route_options" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "OPTIONS /enhance"
  target    = "integrations/${aws_apigatewayv2_integration.result_enhancer_integration.id}"
}

# Stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "query_processor_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.query_processor_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*"
}
resource "aws_lambda_permission" "search_engine_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_engine_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*"
}
resource "aws_lambda_permission" "result_enhancer_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.result_enhancer_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*"
}
