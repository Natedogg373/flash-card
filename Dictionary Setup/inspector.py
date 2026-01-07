import json
import os

# Path to your newly created clean file
FILE_NAME = "spanish_english_final.json"

PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
INPUT_PATH = os.path.join(PARENT_DIR, FILE_NAME)

def inspect_dictionary(file_path):
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    print(f"--- Inspecting: {file_path} ---\n")

    with open(file_path, "r", encoding="utf-8") as f:
        # We use a small buffer-based approach to peek at the start 
        # without loading the whole file into memory
        data = json.load(f) 
        
        # 1. Peek at the first 3 entries
        print("SAMPLE ENTRIES:")
        for i, entry in enumerate(data[:3]):
            print(f"{i+1}. {entry['es']} -> {entry['en']} [{entry['pos']}]")
            print(f"   Tags: {entry['tags'] if entry['tags'] else 'None'}")
        
        # 2. Calculate Statistics
        total_words = len(data)
        no_category_count = sum(1 for entry in data if not entry['tags'])
        category_totals = {}

        for entry in data:
            for tag in entry['tags']:
                category_totals[tag] = category_totals.get(tag, 0) + 1

        # 3. Print Report
        print("\n--- STATS REPORT ---")
        print(f"Total entries: {total_words}")
        print(f"Words with NO category: {no_category_count} ({ (no_category_count/total_words)*100:.1f}%)")
        
        print("\nENTRIES PER CATEGORY:")
        # Sort categories by count (highest first)
        for cat, count in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
            print(f"- {cat}: {count}")

if __name__ == "__main__":
    inspect_dictionary(INPUT_PATH)