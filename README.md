# Spanish Flashcard App

A mobile-native flashcard application for learning Spanish, built with React Native and Expo.

## Features

- **Manual Flashcard Creation**: Type English words to automatically lookup Spanish translations from kaikki dictionary data
- **Reversible Study Mode**: Study flashcards in both directions (English → Spanish and Spanish → English)
- **Category-Based Piles**: Organize flashcards into piles based on topics (foods, travel, games, etc.) or parts of speech (nouns, verbs, adjectives)
- **Progress Tracking**: Tracks the last 10 attempts for each flashcard with success/failure rates
- **Mastery Levels**: 
  - **Learning**: ≤50% success rate (0-5/10)
  - **Understanding**: 60-90% success rate (6-9/10)
  - **Mastered**: 100% success rate (10/10)
- **Filtered Study Sessions**: Select specific piles and mastery levels to customize your study sessions

## Tech Stack

- **React Native** with **Expo** (~50.0.0)
- **TypeScript** for type safety
- **Expo Router** for navigation
- **AsyncStorage** for local data persistence
- **React Native Reanimated** for smooth animations

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Dictionary Data**
   - The Spanish-English dictionary file is located at `data/spanish_english_llm.json`
   - The file has been copied from the parent directory
   - Expected format:
     ```json
     [
       {
         "en": "hello",
         "es": "hola",
         "pos": ["interjection", "noun"],
         "tags": ["greetings", "common"]
       }
     ]
     ```

3. **Run the App**
   ```bash
   npm start
   ```
   
   Then:
   - Press `i` to open iOS simulator
   - Scan QR code with Expo Go app on your iPhone
   - Press `a` to open Android emulator

## Project Structure

```
flash-card/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Study screen
│   │   ├── create.tsx     # Create flashcard screen
│   │   ├── piles.tsx      # Manage piles screen
│   │   └── progress.tsx   # Progress tracking screen
│   └── _layout.tsx        # Root layout
├── components/
│   ├── Flashcard.tsx      # Animated flashcard component
│   ├── ProgressBar.tsx    # Progress visualization
│   └── CategoryFilter.tsx # Mastery level filter
├── services/
│   ├── storage.ts         # AsyncStorage CRUD operations
│   ├── translation.ts     # Kaikki JSON lookup service
│   └── progress.ts        # Mastery level calculations
├── types/
│   └── index.ts           # TypeScript interfaces
├── utils/
│   └── categories.ts      # Category utilities
└── data/
    └── kaikki.json        # Spanish-English dictionary data
```

## Usage

1. **Create Piles**: Go to the "Piles" tab and create categories for organizing flashcards
2. **Create Flashcards**: 
   - Go to the "Create" tab
   - Type an English word
   - Tap the search icon to lookup Spanish translation
   - Select a pile
   - Save the flashcard
3. **Study**: 
   - Go to the "Study" tab
   - Select piles and mastery levels to study
   - Choose study direction (EN→ES, ES→EN, or Both)
   - Start studying and mark each card as correct or incorrect
4. **Track Progress**: View all flashcards, their mastery levels, and attempt history in the "Progress" tab

## Data Models

- **Flashcard**: Contains English/Spanish words, pile assignment, and last 10 attempts
- **Pile**: Category container with name and category type
- **Attempt**: Records timestamp, success/failure, and study direction
- **MasteryLevel**: 'learning' | 'understanding' | 'mastered'

## Development

The app uses Expo for easy development and testing. All data is stored locally using AsyncStorage, making it perfect for an MVP with no backend costs.

## Future Enhancements

- Spaced repetition algorithm
- Statistics dashboard
- Export/import flashcards
- Cloud sync (optional)
- Audio pronunciation
- Example sentences from kaikki data
