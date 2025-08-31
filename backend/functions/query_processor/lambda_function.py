import json
import os
import logging
import openai
import sys
sys.path.append('/var/task')
from utils import build_api_response, log_query

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Configure OpenAI API
openai.api_key = os.environ.get('OPENAI_API_KEY')

def extract_keywords(query):
    """
    Extract relevant keywords and tags from a user query using OpenAI
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a keyword extraction system. Extract relevant search tags from the user query. Return only a JSON array of lowercase keywords without any explanation."},
                {"role": "user", "content": f"Extract search keywords from this query: '{query}'"}
            ],
            max_tokens=100,
            temperature=0.3
        )
        
        # Extract the response content
        content = response.choices[0].message.content.strip()
        
        # Handle various response formats from GPT
        try:
            # Try parsing if it's a properly formatted JSON array
            extracted_tags = json.loads(content)
            if not isinstance(extracted_tags, list):
                # If it parsed but isn't a list, extract it
                if isinstance(extracted_tags, dict) and 'keywords' in extracted_tags:
                    extracted_tags = extracted_tags['keywords']
                else:
                    # Default to splitting by commas if we got a valid JSON but wrong format
                    extracted_tags = [tag.strip().lower() for tag in content.split(',')]
        except json.JSONDecodeError:
            # If it's not valid JSON, just split by commas
            extracted_tags = [tag.strip().lower() for tag in content.split(',')]
        
        # Ensure all tags are strings and lowercase
        extracted_tags = [str(tag).lower() for tag in extracted_tags if tag]
        
        logger.info(f"Extracted tags from query '{query}': {extracted_tags}")
        return extracted_tags
    except Exception as e:
        logger.error(f"Error extracting keywords: {str(e)}")
        # Return empty list on error
        return []

def lambda_handler(event, context):
    """
    Lambda handler for the query processor
    """
    try:
        # Parse the incoming request
        body = json.loads(event.get('body', '{}'))
        query = body.get('query', '')
        
        if not query:
            return build_api_response(400, {
                'error': 'No query provided'
            })
        
        # Extract keywords from the query
        extracted_tags = extract_keywords(query)
        
        # Log the query for analytics
        log_query(query, extracted_tags, 0)  # Results count will be updated by search function
        
        return build_api_response(200, {
            'query': query,
            'extracted_tags': extracted_tags
        })
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        return build_api_response(500, {
            'error': 'Internal server error'
        })