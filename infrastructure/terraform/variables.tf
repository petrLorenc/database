variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket for storing static website files and activities data"
  type        = string
  default     = "activity-database-chatbot"
}

variable "openai_api_key" {
  description = "OpenAI API key for Lambda functions"
  type        = string
  sensitive   = true  # This ensures the value isn't shown in logs
}