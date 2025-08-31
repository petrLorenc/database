# Activity Database Terraform Infrastructure

This directory contains the Terraform implementation of the Activity Database Chatbot infrastructure.

## Prerequisites

- Terraform CLI installed (version >= 1.0.0)
- AWS CLI installed and configured with appropriate credentials
- AWS S3 bucket for storing Terraform state (optional)

## Getting Started

1. Initialize Terraform:

```bash
cd /Users/lorencp/PycharmProjects/activity-database/infrastructure/terraform
terraform init
```

2. Review the execution plan:

```bash
terraform plan
```

3. Apply the configuration to create/update the infrastructure:

```bash
terraform apply
```

4. When prompted, type "yes" to confirm the changes.

## Destroying Infrastructure

To destroy all resources created by this Terraform configuration:

```bash
terraform destroy
```

When prompted, type "yes" to confirm.

## Infrastructure Components

The Terraform configuration deploys the following AWS resources:

- S3 bucket for website hosting and storing activity data
- CloudFront distribution for content delivery
- Secret Manager for storing OpenAI API key
- Lambda functions for processing queries, searching, and enhancing results
- API Gateway to expose Lambda functions as REST endpoints
- IAM roles and permissions

## Important Notes

- Before deploying, make sure your Lambda function code (.zip files) is uploaded to the S3 bucket
- After deployment, update the OpenAI API key in Secrets Manager with your actual key
- The CloudFront distribution uses the S3 website URL as its origin

## Customization

You can customize this infrastructure by modifying the variables in `variables.tf`. For example:

- Change the AWS region
- Use a different S3 bucket name
- Change the name of the OpenAI API key secret

## Outputs

After a successful deployment, Terraform will output:
- Website URL
- CloudFront distribution domain name
- API Gateway endpoint URL