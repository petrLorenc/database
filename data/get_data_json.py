from pathlib import Path
import re
import csv
import json

from unidecode import unidecode

LIMIT = -1  # for test purposes, -1 for all

# Path to the CSV file
csv_file_path = "database_dump.csv"

# Fields to extract
fields_to_extract = [
    ("Jméno", "name"),
    ("Popis", "description"),
    ("Kategorie", "category"),
]

# Resulting dictionary
result = []

CLEANR = re.compile("<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});")


def clean(text: str) -> str:
    return re.sub(CLEANR, "", text).replace("\\n", "<br>")


# Read the CSV file
with open(csv_file_path, mode="r", encoding="utf-8") as file:
    reader = csv.DictReader(
        file, delimiter=","
    )  # Assuming the file uses tab as a delimiter

    for row in reader:
        # Extract the required fields
        item = {
            new_name: row[field].replace("\\n", "<br>")
            for field, new_name in fields_to_extract
        }
        item.update(
            {
                f"{new_name}_clean": clean(row[field])
                for field, new_name in fields_to_extract
            }
        )

        item["tags"] = {}
        # Combine all property fields dynamically
        for key in row:
            if key.startswith("Název") and key.replace("Název", "Hodnota(y)") in row:
                property_key = row[key]
                property_value_key = key.replace("Název", "Hodnota(y)")
                property_value = row[property_value_key]
                if property_key and property_value:
                    item["tags"][property_key] = property_value

        # Add the processed row to the result
        result.append(item)

# Convert the result to JSON format

if LIMIT != -1:
    output_json = json.dumps(result[:LIMIT], ensure_ascii=False, indent=4)
    print(output_json)

clean_json = []
tags_unique = set()

Path("pages").mkdir(exist_ok=True)
for idx, page in enumerate(result):
    if LIMIT != -1 and LIMIT <= idx:
        break
    id_name = unidecode(page["name_clean"]).replace(" ", "_").lower()
    if "/" in id_name or len(id_name) == 0:
        continue

    tags: list = list(page["tags"].values())
    title = page["name_clean"]
    description = page["description"]
    subtitle = page["description_clean"][:120]
    tags_from_description = set(map(lambda x: x.lower().strip(".[](), "), filter(lambda x: "/" not in x and ">" not in x and "<" not in x and x.isalpha(), description.split(" "))))
    tags_unique = tags_unique | tags_from_description
    tags.extend(tags_from_description)

    clean_json.append(
        {
            "id": idx,
            "title": title,
            "tags": tags,
            "short_description": subtitle,
            "long_description": description,
            "thumbnail_url": "https://avatars.githubusercontent.com/u/7677243?s=48&v=4",
            "created_at": "2025-01-15T12:00:00Z",
            "updated_at": "2025-06-20T14:30:00Z",
            "location": tags["Místo"] if "Místo" in tags else "Česká republika",
        }
    )
    print(clean_json[-1])

print(tags_unique)

with open("activities_real.json", "w", encoding="utf-8") as f:
    output = {
        "metadata": {
            "version": "1.0.0",
            "lastUpdated": "2025-08-30T12:00:00Z",
            "totalActivities": len(clean_json),
        },
        "activities": clean_json,
    }
    f.write(json.dumps(output, ensure_ascii=False, indent=4))
