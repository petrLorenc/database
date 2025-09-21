output "s3_website_endpoint" {
  description = "S3 static website hosting endpoint"
  value       = aws_s3_bucket_website_configuration.activity_bucket_website.website_endpoint
}

output "cloudfront_distribution_url" {
  description = "CloudFront distribution URL (when enabled)"
  value       = var.enable_cloudfront ? "https://${aws_cloudfront_distribution.activity_distribution[0].domain_name}" : "CloudFront disabled - use S3 website endpoint"
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_apigatewayv2_api.api.api_endpoint
}