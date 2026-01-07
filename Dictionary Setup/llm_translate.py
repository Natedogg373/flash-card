import json
import os
import time
from wordfreq import top_n_list
from groq import Groq, BadRequestError
from json_repair import repair_json

# --- Configuration ---
GROQ_API_KEY = "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"
OUTPUT_FILENAME = "spanish_english_llm.json"
TOTAL_WORDS_TARGET = 1000
BATCH_SIZE = 20  
LANGUAGE_CODE = "es" # Spanish

# Paths
PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
OUTPUT_PATH = os.path.join(PARENT_DIR, OUTPUT_FILENAME)

client = Groq(api_key=GROQ_API_KEY)

def get_llm_translations(word_list):
    """Quality-focused translation and categorization."""
    prompt = (
        "For each Spanish word provided, return a JSON object containing:\n"
        "1. 'es': The Spanish word.\n"
        "2. 'en': The most common English translation.\n"
        "3. 'pos': A list of parts of speech (e.g., ['noun', 'verb']).\n"
        "4. 'tags': Exactly two high-level categories (e.g., ['Nature', 'Action']).\n\n"
        f"Words: {', '.join(word_list)}"
    )

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system", 
                    "content": (
                        "You are an expert lexicographer. Output ONLY a valid JSON object "
                        "with a 'cards' key containing an array of objects."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        return json.loads(completion.choices[0].message.content).get("cards", [])

    except Exception as e:
        print(f"Error calling LLM: {e}")
        return []

def run_processor():
    processed_cards = []
    seen_words = set()
    
    # Load existing progress
    if os.path.exists(OUTPUT_PATH):
        try:
            with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
                processed_cards = json.load(f)
                seen_words = {card['es'].lower() for card in processed_cards if 'es' in card}
                print(f"✅ Resuming: {len(processed_cards)} cards loaded.")
        except:
            print("⚠️ Could not parse existing file, starting fresh.")

    # 1. Get the top words from wordfreq
    print(f"Fetching top {TOTAL_WORDS_TARGET} words for '{LANGUAGE_CODE}'...")
    full_word_list = top_n_list(LANGUAGE_CODE, TOTAL_WORDS_TARGET * 1.2) # Fetch extra to account for filtering
    
    # 2. Filter list for duplicates and non-alpha
    words_to_process = [
        w for w in full_word_list 
        if w.lower() not in seen_words and w.isalpha() and len(w) > 1
    ]

    print(f"🚀 Processing {len(words_to_process)} new words...")

    for i in range(0, len(words_to_process), BATCH_SIZE):
        if len(processed_cards) >= TOTAL_WORDS_TARGET:
            break

        batch = words_to_process[i:i + BATCH_SIZE]
        results = get_llm_translations(batch)
        
        if results:
            processed_cards.extend(results)
            # Save every batch
            with open(OUTPUT_PATH, "w", encoding="utf-8") as f_out:
                json.dump(processed_cards, f_out, ensure_ascii=False, indent=2)
            
            print(f"Progress: {len(processed_cards)} / {TOTAL_WORDS_TARGET}")
        
        # Groq Rate Limit Protection
        time.sleep(0.5) 

    print(f"✨ Success! {len(processed_cards)} cards saved to {OUTPUT_FILENAME}")

if __name__ == "__main__":
    run_processor()