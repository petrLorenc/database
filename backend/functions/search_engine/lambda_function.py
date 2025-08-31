import json
import os
import logging
import sys
sys.path.append('/var/task')
from utils import load_activities_from_s3, build_api_response, log_query

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Cache for activities data
activities_cache = None
# Cache for inverted index
tag_index = {}

def initialize_cache():
    """
    Initialize the activities cache and build an inverted index for tags
    """
    global activities_cache, tag_index
    
    # Load activities data if not cached
    if activities_cache is None:
        activities_cache = load_activities_from_s3()
        
        # Build an inverted index for tags
        for i, activity in enumerate(activities_cache['activities']):
            for tag in activity['tags']:
                tag = tag.lower()  # Normalize to lowercase for case-insensitive matching
                if tag not in tag_index:
                    tag_index[tag] = []
                tag_index[tag].append(i)
        
        logger.info(f"Built tag index with {len(tag_index)} unique tags")

def search_activities(tags, max_results=3):
    """
    Search for activities matching the given tags
    Uses an inverted index for efficient lookup
    """
    global activities_cache, tag_index
    
    # Make sure cache is initialized
    initialize_cache()
    
    # Handle empty tags
    if not tags or len(tags) == 0:
        return []
    
    # Normalize tags to lowercase
    normalized_tags = [tag.lower() for tag in tags]
    
    # Find activities with matching tags
    matching_indices = set()
    for tag in normalized_tags:
        if tag in tag_index:
            # For the first tag, add all matching activities
            if len(matching_indices) == 0:
                matching_indices = set(tag_index[tag])
            # For subsequent tags, intersect with current matches
            else:
                matching_indices &= set(tag_index[tag])
        
        # Also check for partial matches (substrings)
        for indexed_tag in tag_index:
            if tag in indexed_tag and tag != indexed_tag:
                # For partial matches, we use a union instead of intersection
                matching_indices |= set(tag_index[indexed_tag])
    
    # Score matches based on number of matching tags
    scored_activities = []
    for idx in matching_indices:
        activity = activities_cache['activities'][idx]
        # Calculate score: number of matching tags / total tags in query
        matching_tag_count = sum(1 for tag in normalized_tags if tag in [t.lower() for t in activity['tags']])
        score = matching_tag_count / len(normalized_tags)
        
        # Also boost score for location matches
        if any(tag in activity['location'].lower() for tag in normalized_tags):
            score += 0.2
            
        scored_activities.append((activity, score))
    
    # Sort by score descending
    scored_activities.sort(key=lambda x: x[1], reverse=True)
    
    # Return top N activities
    return [activity for activity, _ in scored_activities[:max_results]]

def lambda_handler(event, context):
    """
    Lambda handler for the search engine
    """
    try:
        # Parse the incoming request
        body = json.loads(event.get('body', '{}'))
        query = body.get('query', '')
        tags = body.get('tags', [])
        max_results = int(body.get('max_results', 3))
        
        if not tags or len(tags) == 0:
            return build_api_response(400, {
                'error': 'No search tags provided'
            })
        
        # Search for matching activities
        results = search_activities(tags, max_results)
        
        # Log the query and results for analytics
        log_query(query, tags, len(results))
        
        return build_api_response(200, {
            'query': query,
            'tags': tags,
            'count': len(results),
            'results': results
        })
    except Exception as e:
        logger.error(f"Error searching activities: {str(e)}")
        return build_api_response(500, {
            'error': 'Internal server error'
        })