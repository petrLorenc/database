import json
import os
import logging
import sys

import openai

from utils import build_api_response, handle_options

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

client = openai.OpenAI(
    base_url=os.environ.get("OPENAI_API_URL"),
    api_key=os.environ.get("OPENAI_API_KEY"),
)


def enhance_results(query, activities):
    """
    Enhance search results with a conversational response using OpenAI
    """
    try:
        if not activities or len(activities) == 0:
            return "Nenašel jsem žádné aktivity odpovídající vašemu vyhledávání. Zkuste použít jiná klíčová slova."

        # Build a prompt for OpenAI
        prompt = f"""
        Uživatel se zeptal na: "{query}"
        
        Našel/a jsem tyto aktivity, které by je mohly zajímat:
        """

        # Add each activity to the prompt
        for i, activity in enumerate(activities):
            prompt += f"""
            {i + 1}. {activity["title"]} - {activity["short_description"]}
            Lokace: {activity["location"]}
            Klíčová slova: {", ".join(activity["tags"])}
            """

        prompt += """
        Vypracujte přátelskou, konverzační a krátkou odpověď s vysvětlením, proč tyto aktivity odpovídají dotazu uživatele. 
        """

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[
                {
                    "role": "system",
                    "content": "Jste užitečný/á asistent/ka pro radu s volnočasovými aktivitami. Buď stručný (maxinum 100 slov), ale zdůrazni klíčové vlastnosti. Nevyjmenovávejte aktivity znovu, pouze vysvětlete, proč se k nim hodí.",
                },
                {"role": "user", "content": prompt},
            ],
            # max_completion_tokens=200,
            # temperature=0.7
        )

        # Extract and return the response
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error enhancing results: {str(e)}")
        return "Zde je několik aktivit, které odpovídají vašemu vyhledávání. Dejte mi vědět, pokud byste o některé z nich chtěli více informací."


def lambda_handler(event, context):
    """
    Lambda handler for the result enhancer
    """
    if event.get("httpMethod") == "OPTIONS":
        return handle_options()
    try:
        # Parse the incoming request
        body = json.loads(event.get("body", "{}"))
        query = body.get("query", "")
        results = body.get("results", [])

        if not query:
            return build_api_response(400, {"error": "No query provided"})

        # Enhance the results with a conversational response
        enhanced_response = enhance_results(query, results)

        return build_api_response(
            200,
            {
                "query": query,
                "count": len(results),
                "results": results,
                "response": enhanced_response,
            },
        )
    except Exception as e:
        logger.error(f"Error enhancing results: {str(e)}")
        return build_api_response(500, {"error": "Internal server error"})
