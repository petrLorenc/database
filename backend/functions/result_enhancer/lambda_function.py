import json
import os
import logging
import openai
import sys
sys.path.append('/var/task')
from utils import build_api_response

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Configure OpenAI API
openai.api_key = os.environ.get('OPENAI_API_KEY')

def enhance_results(query, activities):
    """
    Enhance search results with a conversational response using OpenAI
    """
    try:
        if not activities or len(activities) == 0:
            return "I couldn't find any activities matching your search. Try using different keywords."
        
        # Build a prompt for OpenAI
        prompt = f"""
        The user asked: "{query}"
        
        I found these activities that might interest them:
        """
        
        # Add each activity to the prompt
        for i, activity in enumerate(activities):
            prompt += f"""
            {i+1}. {activity['title']} - {activity['short_description']}
            Location: {activity['location']}
            Tags: {', '.join(activity['tags'])}
            """
        
        prompt += """
        Generate a friendly, conversational response explaining why these activities match the user's query. 
        Be concise but highlight key features. Don't list the activities again, just explain why they're a good match.
        """
        
        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful travel and activities assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.7
        )
        
        # Extract and return the response
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error enhancing results: {str(e)}")
        return "Here are some activities that match your search. Let me know if you'd like more information about any of them."

def lambda_handler(event, context):
    """
    Lambda handler for the result enhancer
    """
    try:
        # Parse the incoming request
        body = json.loads(event.get('body', '{}'))
        query = body.get('query', '')
        results = body.get('results', [])
        
        if not query:
            return build_api_response(400, {
                'error': 'No query provided'
            })
        
        # Enhance the results with a conversational response
        enhanced_response = enhance_results(query, results)
        
        return build_api_response(200, {
            'query': query,
            'count': len(results),
            'results': results,
            'response': enhanced_response
        })
    except Exception as e:
        logger.error(f"Error enhancing results: {str(e)}")
        return build_api_response(500, {
            'error': 'Internal server error'
        })