# Main Terraform configuration file for Activity Database Chatbot

# S3 Bucket for static website and activities data
resource "aws_s3_bucket" "activity_bucket" {
  bucket = var.s3_bucket_name
  force_destroy = true  # Allow the bucket to be destroyed even if it contains objects
}

resource "aws_s3_bucket_website_configuration" "activity_bucket_website" {
  bucket = aws_s3_bucket.activity_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_cors_configuration" "activity_bucket_cors" {
  bucket = aws_s3_bucket.activity_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_ownership_controls" "activity_bucket_ownership" {
  bucket = aws_s3_bucket.activity_bucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "activity_bucket_acl" {
  depends_on = [aws_s3_bucket_ownership_controls.activity_bucket_ownership]
  bucket = aws_s3_bucket.activity_bucket.id
  acl    = "private"
}

# Configure S3 bucket to allow public access
resource "aws_s3_bucket_public_access_block" "activity_bucket_public_access" {
  bucket = aws_s3_bucket.activity_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "activity_bucket_policy" {
  depends_on = [aws_s3_bucket_public_access_block.activity_bucket_public_access]
  bucket = aws_s3_bucket.activity_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.activity_bucket.arn}/*"
      }
    ]
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cloudfront_distribution" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.activity_bucket_website.website_endpoint
    origin_id   = "S3Origin"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  enabled             = true
  default_root_object = "index.html"
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  
  price_class = "PriceClass_100"
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_execution_role" {
  name = "activity_database_lambda_role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_policy" "lambda_s3_access" {
  name        = "activity_database_lambda_s3_access"
  description = "Allow Lambda functions to access S3 bucket"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.activity_bucket.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3_access_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_s3_access.arn
}

# Lambda deployment packages
data "archive_file" "query_processor_zip" {
  type        = "zip"
  source_file = "${path.module}/../../backend/deployments/query_processor.zip"
  output_path = "${path.module}/../../backend/deployments/query_processor_deploy.zip"
}

data "archive_file" "search_engine_zip" {
  type        = "zip"
  source_file = "${path.module}/../../backend/deployments/search_engine.zip"
  output_path = "${path.module}/../../backend/deployments/search_engine_deploy.zip"
}

data "archive_file" "result_enhancer_zip" {
  type        = "zip"
  source_file = "${path.module}/../../backend/deployments/result_enhancer.zip"
  output_path = "${path.module}/../../backend/deployments/result_enhancer_deploy.zip"
}

# Lambda Functions
resource "aws_lambda_function" "query_processor_function" {
  function_name = "activity-database-query-processor"
  filename      = data.archive_file.query_processor_zip.output_path
  source_code_hash = data.archive_file.query_processor_zip.output_base64sha256
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.9"
  timeout       = 10
  memory_size   = 256
  
  environment {
    variables = {
      OPENAI_API_KEY = var.openai_api_key # We'll define this variable
    }
  }
  
  depends_on = [
    aws_s3_bucket.activity_bucket,
    aws_iam_role_policy_attachment.lambda_basic_execution
  ]
}

resource "aws_lambda_function" "search_engine_function" {
  function_name = "activity-database-search-engine"
  filename      = data.archive_file.search_engine_zip.output_path
  source_code_hash = data.archive_file.search_engine_zip.output_base64sha256
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.9"
  timeout       = 10
  memory_size   = 256
  
  environment {
    variables = {
      ACTIVITIES_BUCKET_NAME = aws_s3_bucket.activity_bucket.id
      ACTIVITIES_FILE_KEY    = "activities.json"
    }
  }
  
  depends_on = [
    aws_s3_bucket.activity_bucket,
    aws_iam_role_policy_attachment.lambda_basic_execution
  ]
}

resource "aws_lambda_function" "result_enhancer_function" {
  function_name = "activity-database-result-enhancer"
  filename      = data.archive_file.result_enhancer_zip.output_path
  source_code_hash = data.archive_file.result_enhancer_zip.output_base64sha256
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.9"
  timeout       = 10
  memory_size   = 256
  
  environment {
    variables = {
      OPENAI_API_KEY = var.openai_api_key
    }
  }
  
  depends_on = [
    aws_s3_bucket.activity_bucket,
    aws_iam_role_policy_attachment.lambda_basic_execution
  ]
}

# API Gateway
resource "aws_api_gateway_rest_api" "api_gateway" {
  name        = "ActivityDatabaseChatbotAPI"
  description = "API for Activity Database Chatbot"
}

# API Gateway Resources
resource "aws_api_gateway_resource" "process_query_resource" {
  rest_api_id = aws_api_gateway_rest_api.api_gateway.id
  parent_id   = aws_api_gateway_rest_api.api_gateway.root_resource_id
  path_part   = "process-query"
}

resource "aws_api_gateway_resource" "search_resource" {
  rest_api_id = aws_api_gateway_rest_api.api_gateway.id
  parent_id   = aws_api_gateway_rest_api.api_gateway.root_resource_id
  path_part   = "search"
}

resource "aws_api_gateway_resource" "enhance_resource" {
  rest_api_id = aws_api_gateway_rest_api.api_gateway.id
  parent_id   = aws_api_gateway_rest_api.api_gateway.root_resource_id
  path_part   = "enhance"
}

# API Gateway Methods
resource "aws_api_gateway_method" "process_query_method" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway.id
  resource_id   = aws_api_gateway_resource.process_query_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "process_query_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api_gateway.id
  resource_id             = aws_api_gateway_resource.process_query_resource.id
  http_method             = aws_api_gateway_method.process_query_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.query_processor_function.invoke_arn
}

resource "aws_api_gateway_method" "search_method" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway.id
  resource_id   = aws_api_gateway_resource.search_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "search_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api_gateway.id
  resource_id             = aws_api_gateway_resource.search_resource.id
  http_method             = aws_api_gateway_method.search_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.search_engine_function.invoke_arn
}

resource "aws_api_gateway_method" "enhance_method" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway.id
  resource_id   = aws_api_gateway_resource.enhance_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "enhance_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api_gateway.id
  resource_id             = aws_api_gateway_resource.enhance_resource.id
  http_method             = aws_api_gateway_method.enhance_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.result_enhancer_function.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [
    aws_api_gateway_integration.process_query_integration,
    aws_api_gateway_integration.search_integration,
    aws_api_gateway_integration.enhance_integration
  ]
  
  rest_api_id = aws_api_gateway_rest_api.api_gateway.id
  stage_name  = "dev"
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "query_processor_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.query_processor_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api_gateway.execution_arn}/*/*/process-query"
}

resource "aws_lambda_permission" "search_engine_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_engine_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api_gateway.execution_arn}/*/*/search"
}

resource "aws_lambda_permission" "result_enhancer_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.result_enhancer_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api_gateway.execution_arn}/*/*/enhance"
}

