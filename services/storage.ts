import AsyncStorage from '@react-native-async-storage/async-storage';
import { Flashcard, Pile } from '@/types';

const FLASHCARDS_KEY = '@flashcards';
const PILES_KEY = '@piles';

// Flashcard operations
export const getFlashcards = async (): Promise<Flashcard[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(FLASHCARDS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading flashcards:', e);
    return [];
  }
};

export const saveFlashcard = async (flashcard: Flashcard): Promise<void> => {
  try {
    const flashcards = await getFlashcards();
    const existingIndex = flashcards.findIndex(f => f.id === flashcard.id);
    
    if (existingIndex >= 0) {
      flashcards[existingIndex] = flashcard;
    } else {
      flashcards.push(flashcard);
    }
    
    await AsyncStorage.setItem(FLASHCARDS_KEY, JSON.stringify(flashcards));
  } catch (e) {
    console.error('Error saving flashcard:', e);
    throw e;
  }
};

export const deleteFlashcard = async (id: string): Promise<void> => {
  try {
    const flashcards = await getFlashcards();
    const filtered = flashcards.filter(f => f.id !== id);
    await AsyncStorage.setItem(FLASHCARDS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error deleting flashcard:', e);
    throw e;
  }
};

export const getFlashcardsByPile = async (pileId: string): Promise<Flashcard[]> => {
  const flashcards = await getFlashcards();
  return flashcards.filter(f => f.pileId === pileId);
};

// Pile operations
export const getPiles = async (): Promise<Pile[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(PILES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading piles:', e);
    return [];
  }
};

export const savePile = async (pile: Pile): Promise<void> => {
  try {
    const piles = await getPiles();
    const existingIndex = piles.findIndex(p => p.id === pile.id);
    
    if (existingIndex >= 0) {
      piles[existingIndex] = pile;
    } else {
      piles.push(pile);
    }
    
    await AsyncStorage.setItem(PILES_KEY, JSON.stringify(piles));
  } catch (e) {
    console.error('Error saving pile:', e);
    throw e;
  }
};

export const deletePile = async (id: string): Promise<void> => {
  try {
    const piles = await getPiles();
    const filtered = piles.filter(p => p.id !== id);
    await AsyncStorage.setItem(PILES_KEY, JSON.stringify(filtered));
    
    // Also remove flashcards in this pile
    const flashcards = await getFlashcards();
    const remainingFlashcards = flashcards.filter(f => f.pileId !== id);
    await AsyncStorage.setItem(FLASHCARDS_KEY, JSON.stringify(remainingFlashcards));
  } catch (e) {
    console.error('Error deleting pile:', e);
    throw e;
  }
};

