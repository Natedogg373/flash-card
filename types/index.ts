export interface Attempt {
  timestamp: Date;
  success: boolean;
  direction: 'en-to-es' | 'es-to-en';
}

export interface Flashcard {
  id: string;
  englishWord: string;
  spanishWord: string;
  pileId: string;
  attempts: Attempt[];
  createdAt: Date;
}

export interface Pile {
  id: string;
  name: string;
  category: string;
  createdAt: Date;
}

export type MasteryLevel = 'learning' | 'understanding' | 'mastered';

export interface StudySessionConfig {
  pileIds: string[];
  masteryLevels: MasteryLevel[];
  direction: 'en-to-es' | 'es-to-en' | 'both';
}

