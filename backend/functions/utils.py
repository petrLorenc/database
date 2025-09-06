import json
import os
import boto3
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def load_activities_from_s3():
    """
    Load activities data from S3 bucket
    Returns the activities data as a Python dictionary
    """
    try:
        s3_client = boto3.client('s3')
        bucket_name = os.environ.get('ACTIVITIES_BUCKET_NAME')
        file_key = os.environ.get('ACTIVITIES_FILE_KEY', 'activities.json')
        
        response = s3_client.get_object(Bucket=bucket_name, Key=file_key)
        activities_data = json.loads(response['Body'].read().decode('utf-8'))
        
        logger.info(f"Successfully loaded {len(activities_data['activities'])} activities from S3")
        return activities_data
    except Exception as e:
        logger.error(f"Error loading activities from S3: {str(e)}")
        # Return a minimal valid structure in case of failure
        return {"metadata": {"version": "error", "totalActivities": 0}, "activities": []}


def load_tags_from_s3():
    """
    Load tags data from S3 bucket
    Returns the tags data as a Python dictionary
    """
    try:
        s3_client = boto3.client('s3')
        bucket_name = os.environ.get('TAGS_BUCKET_NAME')
        file_key = os.environ.get('TAGS_FILE_KEY', 'unique_tags.json')
        
        response = s3_client.get_object(Bucket=bucket_name, Key=file_key)
        activities_data = json.loads(response['Body'].read().decode('utf-8'))
        
        logger.info(f"Successfully loaded {len(activities_data['tags'])} tags from S3")
        return activities_data
    except Exception as e:
        logger.error(f"Error loading activities from S3: {str(e)}")
        # Return a minimal valid structure in case of failure
        return {"metadata": {"version": "error", "totalActivities": 0}, "tags": []}


def build_api_response(status_code, body):
    """
    Helper function to build a properly formatted API Gateway response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # For CORS support
            'Access-Control-Allow-Credentials': True
        },
        'body': json.dumps(body)
    }

def log_query(query, extracted_tags, results_count):
    """
    Log search query for analytics
    """
    try:
        logger.info(json.dumps({
            'event_type': 'search_query',
            'query': query,
            'extracted_tags': extracted_tags,
            'results_count': results_count
        }))
    except Exception as e:
        logger.error(f"Error logging query: {str(e)}")