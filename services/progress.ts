import { Flashcard, MasteryLevel, Attempt } from '@/types';

export const calculateMasteryLevel = (flashcard: Flashcard): MasteryLevel => {
  const attempts = flashcard.attempts || [];
  
  if (attempts.length === 0) {
    return 'learning';
  }
  
  // Get last 10 attempts
  const last10Attempts = attempts.slice(-10);
  const successCount = last10Attempts.filter(a => a.success).length;
  const successRate = successCount / last10Attempts.length;
  
  if (successRate === 1.0) {
    return 'mastered';
  } else if (successRate >= 0.6) {
    return 'understanding';
  } else {
    return 'learning';
  }
};

export const addAttempt = (
  flashcard: Flashcard,
  success: boolean,
  direction: 'en-to-es' | 'es-to-en'
): Flashcard => {
  const newAttempt: Attempt = {
    timestamp: new Date(),
    success,
    direction,
  };
  
  const attempts = [...(flashcard.attempts || []), newAttempt];
  
  // Keep only last 10 attempts
  const last10Attempts = attempts.slice(-10);
  
  return {
    ...flashcard,
    attempts: last10Attempts,
  };
};

export const getSuccessRate = (flashcard: Flashcard): number => {
  const attempts = flashcard.attempts || [];
  if (attempts.length === 0) return 0;
  
  const last10Attempts = attempts.slice(-10);
  const successCount = last10Attempts.filter(a => a.success).length;
  return successCount / last10Attempts.length;
};

export const getSuccessCount = (flashcard: Flashcard): number => {
  const attempts = flashcard.attempts || [];
  if (attempts.length === 0) return 0;
  
  const last10Attempts = attempts.slice(-10);
  return last10Attempts.filter(a => a.success).length;
};

