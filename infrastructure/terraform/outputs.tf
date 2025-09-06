output "website_url" {
  description = "URL for the S3 website"
  value       = aws_s3_bucket_website_configuration.activity_bucket_website.website_endpoint
}

output "cloudfront_distribution_domain_name" {
  description = "Domain name for the CloudFront distribution"
  value       = aws_cloudfront_distribution.cloudfront_distribution.domain_name
}

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = "${aws_api_gateway_deployment.api_deployment.invoke_url}"
}