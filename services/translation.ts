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
  if (isLoaded) {
    console.log('Dictionary already loaded');
    return;
  }
  
  try {
    console.log('Loading dictionary...');
    // Load dictionary from data directory
    // In Expo/React Native, we can use require
    const dictionaryJson = require('../data/spanish_english_llm.json');
    const data = dictionaryJson.default || dictionaryJson;
    
    console.log('Dictionary file loaded, parsing...', Array.isArray(data) ? `Array with ${data.length} entries` : 'Not an array');
    
    // Index by English word (lowercase) -> array of entries
    dictionaryData = {};
    if (Array.isArray(data)) {
      let indexedCount = 0;
      let skippedCount = 0;
      data.forEach((entry: DictionaryEntry) => {
        if (entry && entry.en && entry.es) {
          const normalized = entry.en.toLowerCase().trim();
          if (normalized) {
            if (!dictionaryData[normalized]) {
              dictionaryData[normalized] = [];
            }
            dictionaryData[normalized].push(entry);
            indexedCount++;
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
      });
      console.log(`Indexed ${indexedCount} entries into ${Object.keys(dictionaryData).length} unique English words`);
      if (skippedCount > 0) {
        console.log(`Skipped ${skippedCount} invalid entries`);
      }
      
      // Log sample of loaded words for debugging
      const sampleWords = Object.keys(dictionaryData).slice(0, 30);
      console.log(`Sample loaded words: ${sampleWords.join(', ')}`);
    } else {
      console.error('Dictionary data is not an array:', typeof data);
    }
    
    isLoaded = true;
    console.log(`✓ Dictionary loaded successfully: ${Object.keys(dictionaryData).length} unique words`);
  } catch (error) {
    console.error('✗ Could not load spanish_english_llm.json:', error);
    // Fallback: empty data, will return null for lookups
    dictionaryData = {};
    isLoaded = true;
  }
};

export const lookupSpanishTranslation = (englishWord: string): string | null => {
  if (!englishWord || !englishWord.trim()) {
    console.warn('lookupSpanishTranslation: empty word provided');
    return null;
  }
  
  let normalized = englishWord.toLowerCase().trim();
  
  // Try exact match first
  let entries = dictionaryData[normalized];
  
  // If not found, try stripping "to " prefix (for verbs like "to run" -> "run")
  if (!entries || entries.length === 0) {
    if (normalized.startsWith('to ')) {
      const withoutTo = normalized.substring(3).trim();
      entries = dictionaryData[withoutTo];
      if (entries && entries.length > 0) {
        console.log(`Found translation for "${englishWord}" (stripped "to "): ${entries[0].es}`);
        return entries[0].es;
      }
    }
  }
  
  if (entries && entries.length > 0) {
    console.log(`Found translation for "${englishWord}": ${entries[0].es}`);
    // Return the first Spanish translation (most common)
    return entries[0].es;
  }
  
  // Debug: show more information
  const totalWords = Object.keys(dictionaryData).length;
  const sampleWords = Object.keys(dictionaryData).slice(0, 20).join(', ');
  console.warn(`No translation found for "${englishWord}" (normalized: "${normalized}")`);
  console.log(`Dictionary has ${totalWords} unique words. Sample: ${sampleWords}`);
  
  // Try to find similar words (fuzzy match - check if any word contains the search term)
  const similarWords = Object.keys(dictionaryData).filter(word => 
    word.includes(normalized) || normalized.includes(word)
  ).slice(0, 5);
  
  if (similarWords.length > 0) {
    console.log(`Similar words found: ${similarWords.join(', ')}`);
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
  let normalized = englishWord.toLowerCase().trim();
  
  // Try exact match first
  let entries = dictionaryData[normalized];
  
  // If not found, try stripping "to " prefix (for verbs like "to run" -> "run")
  if (!entries || entries.length === 0) {
    if (normalized.startsWith('to ')) {
      const withoutTo = normalized.substring(3).trim();
      entries = dictionaryData[withoutTo];
    }
  }
  
  return entries && entries.length > 0 ? entries[0] : null;
};

export const getAllDictionaryEntries = (englishWord: string): DictionaryEntry[] => {
  const normalized = englishWord.toLowerCase().trim();
  return dictionaryData[normalized] || [];
};

export const getAllDictionaryWords = (): DictionaryEntry[] => {
  const allEntries: DictionaryEntry[] = [];
  Object.values(dictionaryData).forEach((entries) => {
    entries.forEach(entry => allEntries.push(entry));
  });
  return allEntries;
};

export const getSampleWords = (count: number = 20): string[] => {
  return Object.keys(dictionaryData).slice(0, count);
};

export const getDictionaryStats = () => {
  return {
    totalWords: Object.keys(dictionaryData).length,
    totalEntries: Object.values(dictionaryData).reduce((sum, entries) => sum + entries.length, 0),
  };
};

