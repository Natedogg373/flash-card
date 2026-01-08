import { getCategoriesFromKaikki } from '@/services/translation';

export const getAvailableCategories = async (): Promise<string[]> => {
  // Common categories as fallback
  const defaultCategories = [
    'noun',
    'verb',
    'adjective',
    'adverb',
    'preposition',
    'article',
    'pronoun',
    'conjunction',
    'Location',
    'Time',
    'Reference',
    'Grammar',
    'Relationship',
    'Action',
    'Negation',
    'Emphasis',
    'Connection',
  ];
  
  try {
    const dictionaryCategories = getCategoriesFromKaikki();
    if (dictionaryCategories.length > 0) {
      return dictionaryCategories;
    }
  } catch (error) {
    console.warn('Could not get categories from dictionary:', error);
  }
  
  return defaultCategories;
};

