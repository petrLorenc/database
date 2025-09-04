import json
import os
import logging
import openai
import sys
import httpx
sys.path.append('/var/task')
from utils import build_api_response, log_query

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

client = openai.OpenAI(
    base_url=os.environ.get("OPENAI_API_URL"),
    api_key=os.environ.get('OPENAI_API_KEY'),
)


def extract_keywords(query):
    """
    Extract relevant keywords and tags from a user query using OpenAI
    """
    try:
        response = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[
                {"role": "system", "content": "Jsi systém pro extrakci klíčových slov. Extrahuj relevantní vyhledávací tagy z uživatelského dotazu. Vraťte pouze pole klíčových slov (v prvním pádě jednotného čísla) jako JSON pole. Nic více."},
                {"role": "user", "content": "Extrahujte klíčová slova jako JSON pole (JSON array) pro vyhledávání z tohoto dotazu: 'Chci soutěž v Praze pro studenta střední školy'"},
                {"role": "user", "content": '["škola", "student", "soutěž", "Praha", "volný čas", "vzdělání"]'},
                {"role": "user", "content": "Extrahujte klíčová slova jako JSON pole (JSON array) pro vyhledávání z tohoto dotazu: 'Jsem architekt a hledám kurzy na zlepšení svých dovedností v oblasti designu. Jsem z Brna.'"},
                {"role": "user", "content": '["architekt", "kurzy", "design", "vzdělání", "profesionální rozvoj", "Brno", "jihomoravský kraj"]'},
                {"role": "user", "content": f"Extrahujte klíčová slova jako JSON pole (JSON array) pro vyhledávání z tohoto dotazu: '{query}'"},
            ],
            # max_completion_tokens=250,
            # temperature=0.3
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
        extracted_tags = [str(tag).strip().lower() for tag in extracted_tags if tag]
        
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