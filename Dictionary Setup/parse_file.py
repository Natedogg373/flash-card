import json
import os

# --- Configuration ---
INPUT_FILENAME = "es-extract.jsonl"
OUTPUT_FILENAME = "spanish_english_final.json"

# Dynamic Pathing
PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
INPUT_PATH = os.path.join(PARENT_DIR, INPUT_FILENAME)
OUTPUT_PATH = os.path.join(PARENT_DIR, OUTPUT_FILENAME)

CATEGORY_MAP = {
    "food": ["food", "drink", "cooking", "spice", "vegetable", "fruit", "meat", "restaurant", "kitchen"],
    "animals": ["animal", "mammal", "bird", "insect", "fish", "pet", "nature"],
    "travel": ["travel", "transport", "vehicle", "direction", "city", "place", "hotel"],
    "nature": ["weather", "plant", "geography", "environment", "ocean", "landscape"],
    "human": ["body", "family", "emotion", "feeling", "people", "health", "clothing"],
    "time": ["time", "day", "month", "season", "calendar", "numbers"],
    "action": ["verbs", "action", "movement"],
}

def simplify_categories(raw_tags):
    """Maps raw Wiktionary categories to app tags."""
    if not raw_tags:
        return []
    simplified = set()
    for tag in raw_tags:
        tag_lower = str(tag).lower()
        for category, keywords in CATEGORY_MAP.items():
            if any(keyword in tag_lower for keyword in keywords):
                simplified.add(category.capitalize())
    return list(simplified)

def run_processor():
    print(f"Reading from: {INPUT_PATH}")
    if not os.path.exists(INPUT_PATH):
        print(f"Error: Source file not found at {INPUT_PATH}")
        return

    # Key: lowercase word -> Value: aggregated card data
    word_registry = {}

    print("Collapsing all definitions into unique words...")
    
    with open(INPUT_PATH, "r", encoding="utf-8") as f_in:
        for line_num, line in enumerate(f_in):
            try:
                entry = json.loads(line)
                
                # Filter for Spanish only
                if entry.get("lang_code") != "es":
                    continue

                word_es = entry.get("word")
                if not word_es:
                    continue
                
                word_key = word_es.lower() 
                pos = entry.get("pos")

                # Senses contain the definitions
                for sense in entry.get("senses", []):
                    glosses = sense.get("glosses")
                    if not glosses:
                        continue
                    
                    definition = glosses[0]
                    # Note: Wiktionary often puts categories inside "categories" or "links"
                    raw_tags = sense.get("categories", [])
                    new_tags = simplify_categories(raw_tags)

                    if word_key not in word_registry:
                        word_registry[word_key] = {
                            "es": word_es,
                            "en": definition, 
                            "all_pos": [pos] if pos else [],
                            "tags": new_tags,
                            "alt_definitions": [] 
                        }
                    else:
                        # 1. Update POS list if it's a new type (noun vs adj)
                        if pos and pos not in word_registry[word_key]["all_pos"]:
                            word_registry[word_key]["all_pos"].append(pos)
                        
                        # 2. Add as alt_definition if it's a unique definition
                        if definition != word_registry[word_key]["en"] and definition not in word_registry[word_key]["alt_definitions"]:
                            word_registry[word_key]["alt_definitions"].append(definition)
                        
                        # 3. Merge tags
                        if new_tags:
                            combined_tags = set(word_registry[word_key]["tags"]) | set(new_tags)
                            word_registry[word_key]["tags"] = list(combined_tags)

                # Progress indicator
                if line_num % 50000 == 0 and line_num > 0:
                    print(f"Processed {line_num} lines... Found {len(word_registry)} unique words.")

            except Exception as e:
                # Silently skip bad lines to keep the process moving
                continue

    # Convert dictionary to a list for JSON saving
    final_cards = list(word_registry.values())

    print(f"Writing {len(final_cards)} unique words to {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f_out:
        json.dump(final_cards, f_out, ensure_ascii=False, indent=2)

    print("✨ Success! Deduplication complete.")

if __name__ == "__main__":
    run_processor()