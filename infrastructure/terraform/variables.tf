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

variable "openai_api_key_secret_name" {
  description = "Name of the secret in AWS Secrets Manager storing the OpenAI API key"
  type        = string
  default     = "openai-api-key"
}