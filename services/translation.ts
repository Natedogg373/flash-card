// Dictionary structure: Array of objects with { en, es, pos[], tags[] }
interface DictionaryEntry {
  en: string;
  es: string;
  pos: string[];
  tags: string[];
}

// Index by English word (lowercase) -> array of entries (since same word can have multiple translations)
let dictionaryData: Record<string, DictionaryEntry[]> = {};
let isLoaded = false;

export const loadKaikkiData = async (): Promise<void> => {
  if (isLoaded) return;
  
  try {
    // Load dictionary from data directory
    // In Expo, we can import JSON directly
    const dictionaryJson = require('../data/spanish_english_llm.json');
    const data = dictionaryJson.default || dictionaryJson;
    
    // Index by English word (lowercase) -> array of entries
    dictionaryData = {};
    if (Array.isArray(data)) {
      data.forEach((entry: DictionaryEntry) => {
        if (entry.en && entry.es) {
          const normalized = entry.en.toLowerCase().trim();
          if (!dictionaryData[normalized]) {
            dictionaryData[normalized] = [];
          }
          dictionaryData[normalized].push(entry);
        }
      });
    }
    
    isLoaded = true;
    console.log(`Loaded ${Object.keys(dictionaryData).length} unique English words from dictionary`);
  } catch (error) {
    console.warn('Could not load spanish_english_llm.json, using fallback:', error);
    // Fallback: empty data, will return null for lookups
    dictionaryData = {};
    isLoaded = true;
  }
};

export const lookupSpanishTranslation = (englishWord: string): string | null => {
  const normalized = englishWord.toLowerCase().trim();
  const entries = dictionaryData[normalized];
  
  if (entries && entries.length > 0) {
    // Return the first Spanish translation (most common)
    return entries[0].es;
  }
  
  return null;
};

export const getAllSpanishTranslations = (englishWord: string): string[] => {
  const normalized = englishWord.toLowerCase().trim();
  const entries = dictionaryData[normalized];
  
  if (entries && entries.length > 0) {
    // Return all unique Spanish translations
    const translations = new Set<string>();
    entries.forEach(entry => translations.add(entry.es));
    return Array.from(translations);
  }
  
  return [];
};

export const getCategoriesFromKaikki = (): string[] => {
  const categories = new Set<string>();
  
  Object.values(dictionaryData).forEach((entries) => {
    entries.forEach((entry) => {
      if (entry.pos) {
        entry.pos.forEach(pos => categories.add(pos));
      }
      if (entry.tags) {
        entry.tags.forEach(tag => categories.add(tag));
      }
    });
  });
  
  return Array.from(categories).sort();
};

export const getDictionaryEntry = (englishWord: string): DictionaryEntry | null => {
  const normalized = englishWord.toLowerCase().trim();
  const entries = dictionaryData[normalized];
  return entries && entries.length > 0 ? entries[0] : null;
};

export const getAllDictionaryEntries = (englishWord: string): DictionaryEntry[] => {
  const normalized = englishWord.toLowerCase().trim();
  return dictionaryData[normalized] || [];
};

