import json
import os
import random
import logging
from flask import Flask, request, jsonify

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure mock responses
KEYWORD_TEMPLATES = [
    ["outdoor", "hiking", "nature", "adventure"],
    ["indoor", "cooking", "recipe", "food"],
    ["family", "children", "fun", "games"],
    ["sport", "exercise", "fitness", "health"],
    ["art", "creative", "craft", "diy"],
    ["music", "concert", "performance", "entertainment"],
    ["technology", "coding", "programming", "computer"],
    ["reading", "book", "literature", "learning"]
]

ENHANCEMENT_TEMPLATES = [
    "You might enjoy {activity_name}. It's a great way to {description}.",
    "Have you tried {activity_name}? Many people find it's perfect for {description}.",
    "Based on your interests, I recommend {activity_name}. It's ideal for {description}.",
    "{activity_name} could be a good match for you. It allows you to {description}.",
    "Consider trying {activity_name}. It's a wonderful activity that helps you {description}."
]

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """Mock OpenAI chat completions endpoint"""
    data = request.json
    messages = data.get('messages', [])
    
    # Log the incoming request
    logger.info(f"Received request: {json.dumps(data)}")
    
    # Determine the type of response based on the system message
    system_message = next((m for m in messages if m['role'] == 'system'), {}).get('content', '')
    user_message = next((m for m in messages if m['role'] == 'user'), {}).get('content', '')
    
    if "keyword extraction" in system_message.lower():
        # This is a query processor request
        response_content = json.dumps(random.choice(KEYWORD_TEMPLATES))
    
    elif "enhance search results" in system_message.lower():
        # This is a result enhancer request
        try:
            # Try to parse the activities from the user message
            activities_start = user_message.find('[')
            activities_end = user_message.rfind(']')
            
            if activities_start >= 0 and activities_end > activities_start:
                activities_json = user_message[activities_start:activities_end+1]
                activities = json.loads(activities_json)
                
                # Generate enhanced responses for each activity
                enhanced_results = []
                for activity in activities:
                    activity_name = activity.get('name', 'this activity')
                    description = activity.get('description', 'have fun')
                    
                    # Generate a conversational response
                    template = random.choice(ENHANCEMENT_TEMPLATES)
                    enhanced_text = template.format(
                        activity_name=activity_name,
                        description=description[:50] + "..." if len(description) > 50 else description
                    )
                    
                    enhanced_results.append({
                        "original": activity,
                        "enhanced_text": enhanced_text
                    })
                
                response_content = json.dumps({"enhanced_results": enhanced_results})
            else:
                response_content = json.dumps({"enhanced_results": []})
        except Exception as e:
            logger.error(f"Error processing result enhancer request: {str(e)}")
            response_content = json.dumps({"enhanced_results": []})
    
    else:
        # Generic response
        response_content = json.dumps({"response": "This is a mock response from the OpenAI API"})
    
    # Build OpenAI-like response structure
    response = {
        "id": f"mock-{random.randint(1000, 9999)}",
        "object": "chat.completion",
        "created": 1630000000,
        "model": "gpt-3.5-turbo-mock",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response_content
                },
                "finish_reason": "stop"
            }
        ]
    }
    
    logger.info(f"Sending response: {json.dumps(response)}")
    return jsonify(response)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)