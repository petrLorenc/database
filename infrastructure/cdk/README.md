# Activity Database CDK Infrastructure

This directory contains the AWS CDK implementation of the Activity Database Chatbot infrastructure.

## Prerequisites

- AWS CDK CLI installed
- AWS credentials configured
- Python 3.9 or higher

## Getting Started

1. Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows, use: .venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Deploy the stack:

```bash
cdk deploy
```

## CDK Workflow

### Initialize a CDK Project
If you're setting up a new CDK project:

```bash
cdk init app --language python
```

### CDK Commands

#### Synthesize CloudFormation Template
Before deploying, you can generate the CloudFormation template to review:

```bash
cdk synth
```

This command creates a `cdk.out` directory with the synthesized CloudFormation template.

#### List Stacks
To list all stacks in the application:

```bash
cdk ls
```

#### Deploying
To deploy the stack to your AWS account:

```bash
cdk deploy                        # Deploy all stacks
cdk deploy CdkStack               # Deploy a specific stack
cdk deploy --require-approval never # Deploy without approval prompts
```

#### Comparing Changes
To see what changes will be applied:

```bash
cdk diff
```

#### Destroying Resources
To destroy all resources created by the stack:

```bash
cdk destroy                     # Destroy all stacks (will prompt for confirmation)
cdk destroy --force             # Destroy without confirmation prompt
cdk destroy CdkStack            # Destroy a specific stack
```

### Viewing Logs

You can view CloudWatch logs for Lambda functions and other resources using:

1. **AWS Management Console:**
   - Navigate to CloudWatch > Log Groups
   - Find log groups named like `/aws/lambda/activity-database-query-processor`

2. **AWS CLI:**
   ```bash
   # Get the most recent log events for a specific Lambda function
   aws logs get-log-events --log-group-name /aws/lambda/activity-database-query-processor --log-stream-name $(aws logs describe-log-streams --log-group-name /aws/lambda/activity-database-query-processor --order-by LastEventTime --descending --limit 1 --query 'logStreams[0].logStreamName' --output text)
   ```

3. **CDK Toolkit (for errors during deployment):**
   ```bash
   cdk deploy --debug
   ```

### Working with CDK Watch

CDK Watch allows you to automatically update your stacks when source code changes:

```bash
cdk watch
```

This will monitor files specified in the `watch` section of `cdk.json` and automatically deploy changes.

### Testing CDK Infrastructure

The project includes unit tests in the `tests` directory. The tests use the AWS CDK assertions module to verify resource properties.

To run the tests:

```bash
python -m pytest
```

Example test cases check for resources like:
- S3 buckets with proper configuration
- Lambda functions with correct settings
- API Gateway endpoints

### CDK Project Structure

- `app.py` - The CDK app entry point
- `cdk/cdk_stack.py` - The main stack definition
- `cdk.json` - CDK configuration
- `tests/` - Unit tests for infrastructure

## Infrastructure Components

The CDK stack deploys the following AWS resources:

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

## Outputs

The CDK deployment provides the following outputs:
- Website URL
- CloudFront distribution domain name
- API Gateway endpoint URL
