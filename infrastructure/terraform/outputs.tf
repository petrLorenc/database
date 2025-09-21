output "api_gateway_url" {
  description = "API Gateway URL for Vercel frontend"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "api_stage_url" {
  description = "Full API Gateway endpoint with stage"
  value       = "${aws_apigatewayv2_api.api.api_endpoint}/api"
}

output "lambda_functions" {
  description = "Deployed Lambda function names and ARNs"
  value = {
    query_processor = {
      name = aws_lambda_function.query_processor_function.function_name
      arn  = aws_lambda_function.query_processor_function.arn
    }
    search_engine = {
      name = aws_lambda_function.search_engine_function.function_name
      arn  = aws_lambda_function.search_engine_function.arn
    }
    result_enhancer = {
      name = aws_lambda_function.result_enhancer_function.function_name
      arn  = aws_lambda_function.result_enhancer_function.arn
    }
  }
}

output "s3_data_bucket" {
  description = "S3 bucket for data storage"
  value = {
    name = aws_s3_bucket.activity_data_bucket.id
    arn  = aws_s3_bucket.activity_data_bucket.arn
  }
}

output "vercel_environment_variables" {
  description = "Environment variables to set in Vercel project"
  value = {
    REACT_APP_API_BASE_URL = "${aws_apigatewayv2_api.api.api_endpoint}/api"
  }
  sensitive = false
}