import json
import os

from wordfreq import top_n_list

# Get the top 10,000 Spanish words
# common_words = top_n_list('es', 20000)

# print(f"First 50 words: {common_words[:50]}")

# GROQ_API_KEY = "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"

OUTPUT_FILENAME = "spanish_english_llm.json"
PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
FILE_PATH = os.path.join(PARENT_DIR, OUTPUT_FILENAME)

with open(FILE_PATH, "r", encoding="utf-8") as f:
    processed_cards = json.load(f)

import pprint 
pprint.pprint(processed_cards[:10])