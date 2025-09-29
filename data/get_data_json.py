# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "unidecode",
# ]
# ///
from pathlib import Path
import re
import csv
import json
from enum import StrEnum
from collections import namedtuple

from unidecode import unidecode

LIMIT = -1  # for test purposes, -1 for all

# Path to the CSV file
csv_file_path = "database_dump_6_9_2025.csv"


class Case(StrEnum):
    KEEP = "keep"
    LOWERCASE = "lowercase"


FieldMapping = namedtuple("FieldMapping", ["original", "new"])
SubfieldMapping = namedtuple("SubfieldMapping", ["original", "new", "case"])

# Fields to extract, first is the original name, second is the new name
fields_to_extract: list[FieldMapping] = [
    FieldMapping("Jméno", "name"),
    FieldMapping("Popis", "description"),
    FieldMapping("Kategorie", "category"),
]
subfields_to_extract: dict[str, SubfieldMapping] = {
    "Místo": SubfieldMapping("Místo", "location", Case.KEEP),
    "Pro koho": SubfieldMapping("Pro koho", "education_level", Case.LOWERCASE),
    "Typ aktivity": SubfieldMapping("Typ aktivity", "tags", Case.LOWERCASE),
    # "Obor": "tags",
    "Inspirace": SubfieldMapping("Inspirace", "tags", Case.LOWERCASE),
}

# Resulting dictionary
result = []

# Regex pattern to remove HTML tags and entities
CLEANR = re.compile("<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});")


def clean(text: str) -> str:
    return re.sub(CLEANR, "", text).replace("\\n", "<br>")


# Read the CSV file
def read_csv(file_path: str) -> list[dict]:
    with open(file_path, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file, delimiter=",")
        return [row for row in reader]


# Extract and rename fields, clean text, and combine properties
def process_rows(rows: list[dict]) -> list[dict]:
    processed = []
    for row in rows:
        # Rename the field
        item = {
            new_name: row[field].replace("\\n", "<br>")
            for field, new_name in fields_to_extract
        }

        # Clean the text fields
        item.update(
            {
                f"{new_name}_clean": clean(row[field])
                for field, new_name in fields_to_extract
            }
        )

        # Combine all property fields dynamically
        for key in row:
            # Data fields are named like "Název 1", "Hodnota(y) 1", "Název 2", "Hodnota(y) 2", ...
            if (
                key.startswith("Název")
                and (property_value_key := key.replace("Název", "Hodnota(y)")) in row
            ):
                property_key = row[key]
                property_value = row[property_value_key]

                # tag to extract, if it exists in subfields mapping
                if (
                    property_key in subfields_to_extract
                    and property_key
                    and property_value
                ):
                    field_values = [
                        x.replace(".", "").strip(",.\\ ")
                        for x in property_value.split(",")
                    ]

                    # Handle case conversion and initialization of lists
                    if subfields_to_extract[property_key].case == Case.LOWERCASE:
                        field_values = [x.lower() for x in field_values]

                    if subfields_to_extract[property_key] in item:
                        item[subfields_to_extract[property_key].new].extend(
                            field_values
                        )
                    else:
                        item[subfields_to_extract[property_key].new] = field_values

        processed.append(item)
    return processed


def save_json(clean_json, tags_unique, location_unique, education_level_unique):
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

    with open(
        "../frontend/public/data/activities_real.json", "w", encoding="utf-8"
    ) as f:
        output = {
            "metadata": {
                "version": "1.0.0",
                "lastUpdated": "2025-08-30T12:00:00Z",
                "totalActivities": len(clean_json),
            },
            "activities": clean_json,
        }
        f.write(json.dumps(output, ensure_ascii=False, indent=4))

    with open("../frontend/public/data/unique_tags.json", "w", encoding="utf-8") as f:
        output = {
            "metadata": {
                "version": "1.0.0",
                "lastUpdated": "2025-08-30T12:00:00Z",
                "totalActivities": len(tags_unique),
            },
            "tags": sorted(list(tags_unique)),
            "locations": sorted(list(location_unique)),
            "education_levels": sorted(list(education_level_unique)),
        }
        f.write(json.dumps(output, ensure_ascii=False, indent=4))


def get_icon(tags):
    icon_map = {
        "flight": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M552 264C582.9 264 608 289.1 608 320C608 350.9 582.9 376 552 376L424.7 376L265.5 549.6C259.4 556.2 250.9 560 241.9 560L198.2 560C187.3 560 179.6 549.3 183 538.9L237.3 376L137.6 376L84.8 442C81.8 445.8 77.2 448 72.3 448L52.5 448C42.1 448 34.5 438.2 37 428.1L64 320L37 211.9C34.4 201.8 42.1 192 52.5 192L72.3 192C77.2 192 81.8 194.2 84.8 198L137.6 264L237.3 264L183 101.1C179.6 90.7 187.3 80 198.2 80L241.9 80C250.9 80 259.4 83.8 265.5 90.4L424.7 264L552 264z"/></svg>""",
        "default": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M80 259.8L289.2 345.9C299 349.9 309.4 352 320 352C330.6 352 341 349.9 350.8 345.9L593.2 246.1C602.2 242.4 608 233.7 608 224C608 214.3 602.2 205.6 593.2 201.9L350.8 102.1C341 98.1 330.6 96 320 96C309.4 96 299 98.1 289.2 102.1L46.8 201.9C37.8 205.6 32 214.3 32 224L32 520C32 533.3 42.7 544 56 544C69.3 544 80 533.3 80 520L80 259.8zM128 331.5L128 448C128 501 214 544 320 544C426 544 512 501 512 448L512 331.4L369.1 390.3C353.5 396.7 336.9 400 320 400C303.1 400 286.5 396.7 270.9 390.3L128 331.4z"/></svg>""",
        "hands": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M300.9 149.2L184.3 278.8C179.7 283.9 179.9 291.8 184.8 296.7C215.3 327.2 264.8 327.2 295.3 296.7L327.1 264.9C331.3 260.7 336.6 258.4 342 258C348.8 257.4 355.8 259.7 361 264.9L537.6 440L608 384L608 96L496 160L472.2 144.1C456.4 133.6 437.9 128 418.9 128L348.5 128C347.4 128 346.2 128 345.1 128.1C328.2 129 312.3 136.6 300.9 149.2zM148.6 246.7L255.4 128L215.8 128C190.3 128 165.9 138.1 147.9 156.1L144 160L32 96L32 384L188.4 514.3C211.4 533.5 240.4 544 270.3 544L286 544L279 537C269.6 527.6 269.6 512.4 279 503.1C288.4 493.8 303.6 493.7 312.9 503.1L353.9 544.1L362.9 544.1C382 544.1 400.7 539.8 417.7 531.8L391 505C381.6 495.6 381.6 480.4 391 471.1C400.4 461.8 415.6 461.7 424.9 471.1L456.9 503.1L474.4 485.6C483.3 476.7 485.9 463.8 482 452.5L344.1 315.7L329.2 330.6C279.9 379.9 200.1 379.9 150.8 330.6C127.8 307.6 126.9 270.7 148.6 246.6z"/></svg>""",
        "earth": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M320.2 112C435 112.1 528 205.2 528 320C528 342.1 524.6 363.4 518.2 383.4C516.2 383.8 514.1 384 512 384L509.3 384C500.8 384 492.7 380.6 486.7 374.6L457.4 345.3C451.4 339.3 448 331.2 448 322.7L448 272C448 263.2 455.2 256 464 256C472.8 256 480 248.8 480 240C480 231.2 472.8 224 464 224L440 224C426.7 224 416 234.7 416 248C416 261.3 405.3 272 392 272L336 272C327.2 272 320 279.2 320 288C320 296.8 312.8 304 304 304L278.6 304C266.1 304 256 293.9 256 281.4C256 275.4 258.4 269.6 262.6 265.4L332.7 195.3C334.8 193.2 336 190.3 336 187.3C336 181.1 330.9 176 324.7 176L310.6 176C298.1 176 288 165.9 288 153.4C288 147.4 290.4 141.6 294.6 137.4L317.7 114.3C318.5 113.5 319.3 112.8 320.2 112.1zM502.4 420.1C469.6 479.7 408.5 521.5 337.2 527.3C336.5 525 336.1 522.5 336.1 520C336.1 506.7 325.4 496 312.1 496L285.4 496C276.9 496 268.8 492.6 262.8 486.6L233.5 457.3C227.5 451.3 224.1 443.2 224.1 434.7L224.1 368C224.1 350.3 238.4 336 256.1 336L354.8 336C363.3 336 371.4 339.4 377.4 345.4L406.7 374.7C412.7 380.7 420.8 384.1 429.3 384.1L434.8 384.1C443.3 384.1 451.4 387.5 457.4 393.5L473.4 409.5C477.6 413.7 483.4 416.1 489.4 416.1C494.2 416.1 498.7 417.6 502.4 420.2zM320 576L346.2 574.7C337.6 575.6 328.9 576 320 576zM346.2 574.7C475.3 561.6 576 452.6 576 320C576 178.6 461.4 64 320 64L320 64C178.6 64 64 178.6 64 320C64 447.5 157.2 553.3 279.3 572.8C292.5 574.9 306.1 576 320 576zM251.3 187.3L219.3 219.3C213.1 225.5 202.9 225.5 196.7 219.3C190.5 213.1 190.5 202.9 196.7 196.7L228.7 164.7C234.9 158.5 245.1 158.5 251.3 164.7C257.5 170.9 257.5 181.1 251.3 187.3z"/></svg>""",
        "trophy": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z"/></svg>""",
        "book": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M480 576L192 576C139 576 96 533 96 480L96 160C96 107 139 64 192 64L496 64C522.5 64 544 85.5 544 112L544 400C544 420.9 530.6 438.7 512 445.3L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L480 576zM192 448C174.3 448 160 462.3 160 480C160 497.7 174.3 512 192 512L448 512L448 448L192 448zM224 216C224 229.3 234.7 240 248 240L424 240C437.3 240 448 229.3 448 216C448 202.7 437.3 192 424 192L248 192C234.7 192 224 202.7 224 216zM248 288C234.7 288 224 298.7 224 312C224 325.3 234.7 336 248 336L424 336C437.3 336 448 325.3 448 312C448 298.7 437.3 288 424 288L248 288z"/></svg>""",
    }
    str_tags = " ".join(tags)
    if "výjezd do zahraničí" in str_tags:
        return icon_map["flight"]
    elif "soutěž" in str_tags:
        return icon_map["trophy"]
    elif "stipendium" in str_tags:
        return icon_map["earth"]
    elif "dobrovolnic" in str_tags:
        return icon_map["hands"]
    elif "kurz" in str_tags or "inspirativní" in str_tags or "rozvoj" in str_tags:
        return icon_map["book"]

    return icon_map["default"]


def main():
    rows = read_csv(csv_file_path)
    result = process_rows(rows)

    # Convert the result to JSON format

    if LIMIT != -1:
        output_json = json.dumps(result[:LIMIT], ensure_ascii=False, indent=4)
        print(output_json)

    clean_json = []
    tags_unique = set()
    location_unique = set()
    education_level_unique = set()

    Path("pages").mkdir(exist_ok=True)
    for idx, page in enumerate(result):
        if LIMIT != -1 and LIMIT <= idx:
            break
        id_name = unidecode(page["name_clean"]).replace(" ", "_").lower()
        if "/" in id_name or len(id_name) == 0:
            continue

        title = page["name_clean"]
        description = page["description"]
        subtitle = page["description_clean"][:120]
        tags_unique.update(page.get("tags", []))
        location_unique.update(page.get("location", []))
        education_level_unique.update(page.get("education_level", []))

        clean_json.append(
            {
                "id": idx,
                "title": title,
                "location": page.get("location", []),
                "tags": page.get("tags", []),
                "education_level": page.get("education_level", []),
                "short_description": subtitle,
                "long_description": description,
                "thumbnail_url": get_icon(page.get("tags", [])),
                "created_at": "2025-01-15T12:00:00Z",
                "updated_at": "2025-06-20T14:30:00Z",
            }
        )
        # print(clean_json[-1])

    print(tags_unique)
    save_json(clean_json, tags_unique, location_unique, education_level_unique)


if __name__ == "__main__":
    main()
