# Activity Database Chatbot

A serverless web application that enables natural language search for activities using AI. The application processes user queries, extracts relevant keywords, searches a database of activities, and returns enhanced conversational responses.

## Project Structure

The project is organized into three main components:

### Frontend

A React-based single-page application that provides a chat interface for users to interact with the activity database.

- `/frontend`: Contains the React application code
  - `/src/components`: React components for the UI
  - `/src/services`: API service for backend communication

### Backend

A collection of AWS Lambda functions that process user queries, search for activities, and enhance results.

- `/backend`: Contains the serverless backend code
  - `/functions/query_processor`: Extracts keywords from natural language queries using OpenAI
  - `/functions/search_engine`: Searches the activities database using the extracted keywords
  - `/functions/result_enhancer`: Enhances search results with conversational responses using OpenAI

### Infrastructure

CloudFormation templates and deployment scripts for AWS resources.

- `/infrastructure`: Contains the infrastructure as code
  - `/cloudformation`: CloudFormation templates and deployment scripts

## Technology Stack

- **Frontend**: React
- **Backend**: Python, AWS Lambda
- **Infrastructure**: AWS CloudFormation, API Gateway, S3, CloudFront
- **AI Services**: OpenAI GPT-3.5 Turbo

## Local Development

### Prerequisites

- Node.js 14+
- Python 3.9+
- AWS CLI

### Frontend Development

```bash
cd frontend
npm install
npm start
```

### Backend Development

```bash
cd backend
pip install -r requirements.txt
```

You can use a local environment file (.env) to set the required environment variables:

```
OPENAI_API_KEY=your-api-key
ACTIVITIES_BUCKET_NAME=your-bucket-name
```

## Deployment

You have two options for deploying the infrastructure: using CloudFormation or AWS CDK.

### Option 1: Using CloudFormation

1. Make sure your AWS CLI is configured with appropriate credentials.
2. Run the deployment script:

```bash
cd infrastructure/cloudformation
chmod +x deploy.sh
./deploy.sh
```

This script will:
- Create necessary S3 buckets
- Package and upload Lambda functions
- Deploy the CloudFormation stack
- Output the API endpoint URL

### Option 2: Using AWS CDK

1. Install AWS CDK globally:
```bash
npm install -g aws-cdk
```

2. Configure your AWS credentials:
```bash
aws configure
```

3. Navigate to the CDK directory:
```bash
cd infrastructure/cdk
```

4. Create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows, use: .venv\Scripts\activate
```

5. Install dependencies:
```bash
pip install -r requirements.txt
```

6. Deploy the stack:
```bash
cdk deploy
```

7. To destroy the infrastructure when no longer needed:
```bash
cdk destroy
```

For more details on working with CDK, refer to the [CDK README](/infrastructure/cdk/README.md).

### Frontend

1. Update the API endpoint in the frontend configuration:

```bash
cd frontend
# Create a .env file with the API endpoint
echo "REACT_APP_API_BASE_URL=your-api-endpoint" > .env
```

2. Build and deploy the frontend:

```bash
npm run build
aws s3 sync build/ s3://your-bucket-name
```

## License

MIT