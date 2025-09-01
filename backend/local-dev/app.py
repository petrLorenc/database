import os
import json
import logging
import importlib.util
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure S3 client to use Minio
s3_client = boto3.client(
    's3',
    endpoint_url=os.environ.get('AWS_ENDPOINT_URL', 'http://minio:9000'),
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID', 'minioadmin'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY', 'minioadmin'),
    region_name=os.environ.get('AWS_REGION', 'us-east-1'),
)

# Function to import a lambda function from a file path
def import_lambda_function(function_path):
    """Import a lambda function from a file path"""
    module_name = os.path.basename(function_path).replace('.py', '')
    spec = importlib.util.spec_from_file_location(module_name, function_path) 
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module.lambda_handler

# Import lambda functions
query_processor = import_lambda_function('functions/query_processor/lambda_function.py')
search_engine = import_lambda_function('functions/search_engine/lambda_function.py')
result_enhancer = import_lambda_function('functions/result_enhancer/lambda_function.py')

@app.route('/api/query', methods=['POST'])
def process_query():
    """Process a user query through the query processor Lambda"""
    try:
        # Create a Lambda-like event object
        event = {
            'body': json.dumps(request.json)
        }
        
        # Call the query processor Lambda
        response = query_processor(event, {})
        logger.info(response.get('body', ''))

        # Return the response
        return jsonify(json.loads(response.get('body', '{}')))
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['POST'])
def search_activities():
    """Search for activities using the search engine Lambda"""
    try:
        # Create a Lambda-like event object
        event = {
            'body': json.dumps(request.json)
        }
        
        # Call the search engine Lambda
        response = search_engine(event, {})
        logger.info(response.get('body', ''))

        # Return the response
        return jsonify(json.loads(response.get('body', '{}')))
    except Exception as e:
        logger.error(f"Error searching activities: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/enhance', methods=['POST'])
def enhance_results():
    """Enhance search results using the result enhancer Lambda"""
    try:
        # Create a Lambda-like event object
        event = {
            'body': json.dumps(request.json)
        }
        
        # Call the result enhancer Lambda
        response = result_enhancer(event, {})
        logger.info(response.get('body', ''))

        # Return the response
        return jsonify(json.loads(response.get('body', '{}')))
    except Exception as e:
        logger.error(f"Error enhancing results: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Combined endpoint that handles the full chat flow:
    1. Process the query to extract keywords
    2. Search for activities based on keywords
    3. Enhance the results with conversational responses
    """
    try:
        # Get the query from the request
        data = request.json
        query = data.get('query', '')
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
        
        # Step 1: Process the query
        query_event = {'body': json.dumps({'query': query})}
        query_response = query_processor(query_event, {})
        query_result = json.loads(query_response.get('body', '{}'))
        
        # Extract the keywords
        keywords = query_result.get('extracted_tags', [])
        
        # Step 2: Search for activities
        search_event = {'body': json.dumps({'keywords': keywords})}
        search_response = search_engine(search_event, {})
        search_result = json.loads(search_response.get('body', '{}'))
        
        # Get the activities
        activities = search_result.get('activities', [])
        
        # Step 3: Enhance the results
        enhance_event = {'body': json.dumps({'query': query, 'activities': activities})}
        enhance_response = result_enhancer(enhance_event, {})
        enhance_result = json.loads(enhance_response.get('body', '{}'))
        
        # Return the final response
        return jsonify({
            'query': query,
            'keywords': keywords,
            'results': enhance_result.get('enhanced_results', [])
        })
    except Exception as e:
        logger.error(f"Error processing chat: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)