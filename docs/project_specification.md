# Activity Database Chatbot - Project Specification

## Project Overview
A web-based chatbot application that allows users to search through a database of activities based on natural language queries. The system will analyze user questions, extract relevant search parameters, and present the top matching activities with visual and textual information. The architecture is optimized for minimum cost while maintaining functionality for 100-200 monthly active users.

## Core Features
1. Natural language processing of user queries
2. Tag-based search functionality over a database of ~400 activities
3. Responsive chat-like interface
4. Visual display of search results with thumbnails
5. Secure API management
6. Cost-efficient serverless architecture
7. Usage analytics

## Data Model

### Activity
Each activity in the database will have the following attributes:
- **id**: Unique identifier for the activity
- **title**: Name of the activity
- **tags**: Array of keywords (e.g., ["hiking", "mountain", "family-friendly", "NewYork"])
- **thumbnail_url**: Link to image representing the activity
- **short_description**: Brief summary (50-100 words)
- **long_description**: Detailed information (200-500 words)
- **location**: Geographical information
- **created_at**: Timestamp
- **updated_at**: Timestamp

### Sample Activity JSON
```json
{
  "id": "act-123",
  "title": "Cascade Mountain Trail Hike",
  "tags": ["hiking", "mountain", "outdoor", "AdirondackPark", "NewYork", "moderate"],
  "thumbnail_url": "https://activities-thumbnails.s3.amazonaws.com/cascade-trail.jpg",
  "short_description": "A popular 4.8-mile round trip hike offering spectacular views of the Adirondack High Peaks region.",
  "long_description": "Cascade Mountain is one of the most popular hikes in the Adirondack High Peaks region, and for good reason. The 4.8-mile round trip offers spectacular 360-degree views and is considered a great introduction to the High Peaks for novice hikers. The trail ascends 1,940 feet and follows a well-worn path through northern hardwood forest. The upper portion of the trail opens to bare rock with increasingly panoramic views. The summit is completely bare and offers unobstructed views in all directions.",
  "location": "Adirondack Park, New York",
  "created_at": "2025-01-15T12:00:00Z",
  "updated_at": "2025-06-20T14:30:00Z"
}
```

## Architecture

### Overview
The application will use a serverless architecture on AWS to minimize costs while ensuring scalability. The frontend will be hosted on AWS S3, and backend functionality will be handled by AWS Lambda functions. To minimize costs, the application will use a JSON file stored in S3 rather than a database service.

### Components

#### Frontend
- **Hosting**: AWS S3 for static website hosting
- **CDN**: AWS CloudFront for content delivery
- **Technologies**: HTML5, CSS3, JavaScript
- **Framework**: React.js for UI components (lightweight configuration)

#### Backend
- **Compute**: AWS Lambda functions (Python 3.9+)
- **API Gateway**: To create RESTful endpoints for Lambda functions
- **Data Storage**: JSON file stored in S3 (loaded into Lambda memory)
- **Search Functionality**: 
  - Custom Python-based in-memory search using efficient algorithms
  - Pre-processed tag indices for faster lookup

#### ML/AI Components
- **LLM Integration**: OpenAI API (GPT-3.5 Turbo) for best cost efficiency
- **Query Processing**: LLM-based keyword extraction
- **Result Ranking**: Custom Python algorithm to score and rank search results
- **Data Collection**: Basic structured logging of queries and results for future model training

#### Security
- **API Keys**: Secure storage in AWS Secrets Manager
- **Rate Limiting**: Implemented in API Gateway
- **Simple Security Measures**: CORS configuration and basic request validation

#### Analytics
- **User Tracking**: Google Analytics integration via frontend (free tier)
- **API Usage**: Basic CloudWatch Metrics and Logs
- **Custom Events**: Minimal logging of search queries and results

### Infrastructure as Code
- Primary: AWS CloudFormation templates (free to use)

## Data Flow

1. **User Interaction**:
   - User enters a question in the chat interface
   - Example: "What can I do in the Adirondacks when I like hiking?"

2. **Query Processing**:
   - Frontend sends query to API Gateway endpoint
   - Lambda function forwards the query to OpenAI API for keyword extraction
   - LLM extracts relevant tags and search parameters (e.g., "hiking", "Adirondacks")
   - The query and extracted keywords are logged to S3 for future model training

3. **Search Operation**:
   - Lambda function performs in-memory search on the JSON activity data
   - Activities are filtered by matching tags and relevant metadata
   - Results are scored and ranked based on relevance
   - Top 3 activities are selected
   - Basic search parameters and results are logged

4. **Result Enhancement**:
   - Selected activities are sent to OpenAI API (GPT-3.5 Turbo)
   - LLM generates a conversational response explaining why these activities match the query
   - The prompt and response are logged in a compressed format

5. **Response Delivery**:
   - API returns the enhanced results to the frontend
   - Frontend displays the chatbot response with thumbnails and descriptions
   - Basic analytics event is logged

## Data Storage: JSON Approach

The system will use a JSON file stored in S3 as the primary data store for activities, chosen specifically to minimize costs.

### Implementation Details

1. **JSON Structure**:
   - Single file containing an array of all activity objects
   - Organized with proper indexing for efficient lookups
   - Additional metadata section for version tracking and last update timestamp

2. **Deployment and Caching**:
   - Store the complete activity database as a single JSON file in S3
   - Lambda function loads and caches the JSON data during initialization
   - Implement memory-efficient data structures for quick lookups
   - Cache the loaded data between Lambda invocations (using container reuse)
   - Periodic checks for updated versions (every 30 minutes)

3. **Performance Optimization**:
   - Pre-process tags into inverted indices during initialization
   - Store activities in memory using optimized data structures
   - Configure Lambda with 256MB memory for adequate performance
   - Implement efficient filtering and scoring algorithms

4. **Update Mechanism**:
   - Provide a simple admin tool to upload new JSON versions
   - Implement S3 versioning for rollback capability
   - Use object metadata or separate control file to track versions

## Cost Forecast (100-200 Monthly Active Users with Minimum Configuration)

Based on the projected usage of 100-200 monthly active users, here is an estimated cost breakdown optimized for minimum spend. These estimates assume each user makes an average of 5 queries per month.

### AWS Services Monthly Costs

| Service | Usage Estimate | Monthly Cost (USD) |
|---------|----------------|---------------------|
| **Lambda** | 1,000 requests/month (256MB memory) | $0.30 - $0.50 |
| **API Gateway** | 1,000 API calls/month | $3.50 |
| **S3 Storage** | 1GB for static website + thumbnails + JSON data | $0.023 |
| **S3 Requests** | 5,000 requests/month | $0.02 |
| **CloudFront** | 5GB data transfer | $0.50 |
| **Secrets Manager** | API key storage | $0.40 |
| **CloudWatch** | Basic monitoring | $0.00 - $0.50 |
| **Total AWS** |  | **$4.74 - $5.44** |

### External API Costs

| Service | Usage Estimate | Monthly Cost (USD) |
|---------|----------------|---------------------|
| **OpenAI API** (GPT-3.5 Turbo) | 1,000 queries × ~500 tokens per query | $0.75 |
| **Total External API** |  | **$0.75** |

### Total Estimated Monthly Cost

| Configuration | Monthly Cost (USD) |
|---------------|---------------------|
| **Minimum Configuration** (AWS + GPT-3.5) | **$5.49 - $6.19** |

### Cost Optimization Measures Implemented

1. **Eliminated DynamoDB**: Saving $1.00 - $2.00 per month by using S3-hosted JSON instead
2. **Using GPT-3.5 Turbo**: The most cost-effective LLM option
3. **Optimized Lambda Memory**: Balanced between performance and cost
4. **Minimal CloudWatch Usage**: Basic monitoring only
5. **No WAF or Additional Security Services**: Appropriate for low-traffic applications
6. **Simplified Architecture**: Fewer AWS services means lower overall costs

The estimated monthly cost of $5.49 - $6.19 represents significant savings compared to more complex architectures while maintaining all core functionality required for the activity database chatbot.

## Implementation Phases

### Phase 1: Core Infrastructure
- Set up S3 buckets for website hosting and data storage
- Create the activity JSON database structure
- Implement Lambda function with in-memory search
- Configure API Gateway endpoints

### Phase 2: Frontend & Integration
- Develop lightweight chat interface using React
- Implement API integration
- Set up basic Google Analytics
- Implement error handling

### Phase 3: LLM Integration
- Connect to OpenAI API (GPT-3.5 Turbo)
- Implement keyword extraction and response enhancement
- Optimize token usage to minimize costs
- Set up basic data logging

### Phase 4: Testing & Optimization
- Load testing
- Basic security validation
- Cost monitoring
- Performance tuning

## Development Requirements

### Tools & Libraries
- **Backend**: 
  - Python 3.9+
  - Boto3 for AWS SDK
  - Requests for API calls
  - OpenAI API client

- **Frontend**:
  - React.js (lightweight configuration)
  - Axios for API requests
  - Basic CSS for styling

- **DevOps**:
  - AWS CLI
  - AWS CloudFormation

## Success Criteria
1. System successfully processes natural language queries
2. Search results are relevant to user queries
3. LLM responses are informative and helpful
4. Frontend displays results with thumbnails as specified
5. All security measures are implemented
6. System maintains low latency (<2s for complete responses)
7. Infrastructure costs remain within budget
8. Analytics provide useful insights