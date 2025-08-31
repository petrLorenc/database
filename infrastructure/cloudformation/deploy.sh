#!/bin/bash
set -e

# Configuration
STACK_NAME="activity-database-chatbot"
BUCKET_NAME="activity-database-chatbot-deployment-$(date +%s)"
REGION="us-east-1"
TEMPLATE_FILE="template.yaml"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment of Activity Database Chatbot infrastructure...${NC}"

# Create S3 bucket for CloudFormation template and Lambda code
echo -e "${YELLOW}Creating deployment bucket: ${BUCKET_NAME}${NC}"
aws s3 mb s3://${BUCKET_NAME} --region ${REGION}

# Package Lambda functions
echo -e "${YELLOW}Packaging Lambda functions...${NC}"

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Created temporary directory: ${TEMP_DIR}${NC}"

# Function to package a Lambda function
package_lambda() {
    FUNCTION_NAME=$1
    FUNCTION_DIR="../../backend/functions/${FUNCTION_NAME}"
    OUTPUT_ZIP="${TEMP_DIR}/${FUNCTION_NAME}.zip"
    
    echo -e "${YELLOW}Packaging ${FUNCTION_NAME} Lambda function...${NC}"
    
    # Create zip package with the Lambda function and utils
    cd ${FUNCTION_DIR}
    cp ../../functions/utils.py .
    zip -r ${OUTPUT_ZIP} *.py
    rm utils.py
    
    # Install dependencies into a package directory
    PACKAGE_DIR="${TEMP_DIR}/${FUNCTION_NAME}_package"
    mkdir -p ${PACKAGE_DIR}
    pip install -r ../../../requirements.txt --target ${PACKAGE_DIR}
    
    # Add dependencies to the zip file
    cd ${PACKAGE_DIR}
    zip -r ${OUTPUT_ZIP} .
    
    # Upload to S3
    aws s3 cp ${OUTPUT_ZIP} s3://${BUCKET_NAME}/lambda/${FUNCTION_NAME}.zip
    
    echo -e "${GREEN}Packaged and uploaded ${FUNCTION_NAME}${NC}"
}

# Package each Lambda function
package_lambda "query_processor"
package_lambda "search_engine"
package_lambda "result_enhancer"

# Upload activities.json data file
echo -e "${YELLOW}Uploading activities data file...${NC}"
aws s3 cp ../../data/activities.json s3://${BUCKET_NAME}/activities.json

# Upload CloudFormation template
echo -e "${YELLOW}Uploading CloudFormation template...${NC}"
aws s3 cp ${TEMPLATE_FILE} s3://${BUCKET_NAME}/template.yaml

# Deploy CloudFormation stack
echo -e "${YELLOW}Deploying CloudFormation stack...${NC}"
aws cloudformation create-stack \
    --stack-name ${STACK_NAME} \
    --template-url https://${BUCKET_NAME}.s3.amazonaws.com/template.yaml \
    --capabilities CAPABILITY_IAM \
    --parameters ParameterKey=S3BucketName,ParameterValue=${BUCKET_NAME}

echo -e "${YELLOW}Waiting for stack creation to complete...${NC}"
aws cloudformation wait stack-create-complete --stack-name ${STACK_NAME}

# Get outputs
echo -e "${GREEN}Stack created successfully! Retrieving outputs...${NC}"
API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query "Stacks[0].Outputs[?OutputKey=='APIEndpoint'].OutputValue" --output text)
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionDomainName'].OutputValue" --output text)

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}API Endpoint:${NC} ${API_ENDPOINT}"
echo -e "${YELLOW}CloudFront URL:${NC} ${CLOUDFRONT_URL}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Set your OpenAI API key in AWS Secrets Manager"
echo -e "2. Update the API endpoint in your frontend configuration"
echo -e "3. Build and deploy the frontend to the S3 bucket"

# Clean up
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
rm -rf ${TEMP_DIR}

echo -e "${GREEN}Done!${NC}"