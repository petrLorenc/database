output "s3_website_endpoint" {
  description = "S3 static website hosting endpoint"
  value       = aws_s3_bucket_website_configuration.activity_bucket_website.website_endpoint
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_apigatewayv2_api.api.api_endpoint
}