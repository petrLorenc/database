import os

import openai
import dotenv

dotenv.load_dotenv(dotenv.find_dotenv())

client = openai.OpenAI(
    base_url=os.environ.get("OPENAI_API_URL"),
    api_key=os.environ.get('OPENAI_API_KEY'),
)

query = "Chci soutěž v Praze pro studenta střední školy"

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
print(response.choices[0].message.content.strip())
import json

print(json.loads(response.choices[0].message.content.strip()))