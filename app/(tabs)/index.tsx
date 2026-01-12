import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getFlashcards, getPiles, saveFlashcard } from '@/services/storage';
import { calculateMasteryLevel, addAttempt } from '@/services/progress';
import { Flashcard, Pile, MasteryLevel } from '@/types';
import FlashcardComponent from '@/components/Flashcard';
import CategoryFilter from '@/components/CategoryFilter';

export default function StudyScreen() {
  const [piles, setPiles] = useState<Pile[]>([]);
  const [selectedPileIds, setSelectedPileIds] = useState<string[]>([]);
  const [selectedMasteryLevels, setSelectedMasteryLevels] = useState<MasteryLevel[]>(['learning', 'understanding', 'mastered']);
  const [studyDirection, setStudyDirection] = useState<'en-to-es' | 'es-to-en' | 'both'>('en-to-es');
  const [isStudying, setIsStudying] = useState(false);
  const [studyFlashcards, setStudyFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentDirection, setCurrentDirection] = useState<'en-to-es' | 'es-to-en'>('en-to-es');

  useEffect(() => {
    loadPiles();
  }, []);

  const loadPiles = async () => {
    const loadedPiles = await getPiles();
    setPiles(loadedPiles);
  };

  const startStudySession = async () => {
    if (selectedPileIds.length === 0) {
      Alert.alert('Error', 'Please select at least one pile');
      return;
    }

    if (selectedMasteryLevels.length === 0) {
      Alert.alert('Error', 'Please select at least one mastery level');
      return;
    }

    try {
      // Get all flashcards from selected piles
      const allFlashcards = await getFlashcards();
      console.log(`Total flashcards: ${allFlashcards.length}`);
      console.log(`Selected pile IDs: ${selectedPileIds.join(', ')}`);
      
      let filtered = allFlashcards.filter(f => selectedPileIds.includes(f.pileId));
      console.log(`Flashcards in selected piles: ${filtered.length}`);

      // Filter by mastery level
      filtered = filtered.filter(f => {
        const mastery = calculateMasteryLevel(f);
        return selectedMasteryLevels.includes(mastery);
      });
      console.log(`Flashcards after mastery filter: ${filtered.length}`);

      if (filtered.length === 0) {
        Alert.alert('No Cards', 'No flashcards match your selected criteria');
        return;
      }

      // Shuffle flashcards
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      console.log(`Starting study session with ${shuffled.length} flashcards`);
      
      // Set initial direction
      let initialDirection: 'en-to-es' | 'es-to-en' = 'en-to-es';
      if (studyDirection === 'both') {
        initialDirection = Math.random() > 0.5 ? 'en-to-es' : 'es-to-en';
      } else {
        initialDirection = studyDirection;
      }
      
      // Update all state at once to ensure consistency
      setStudyFlashcards(shuffled);
      setCurrentCardIndex(0);
      setCurrentDirection(initialDirection);
      setIsStudying(true);
      
      console.log('Study session started, isStudying should be true');
    } catch (error) {
      console.error('Error starting study session:', error);
      Alert.alert('Error', 'Failed to start study session');
    }
  };

  const handleSuccess = async () => {
    if (studyFlashcards.length === 0) return;

    const currentCard = studyFlashcards[currentCardIndex];
    const updatedCard = addAttempt(currentCard, true, currentDirection);
    const updatedFlashcards = [...studyFlashcards];
    updatedFlashcards[currentCardIndex] = updatedCard;
    setStudyFlashcards(updatedFlashcards);

    await saveFlashcard(updatedCard);

    moveToNextCard();
  };

  const handleFailure = async () => {
    if (studyFlashcards.length === 0) return;

    const currentCard = studyFlashcards[currentCardIndex];
    const updatedCard = addAttempt(currentCard, false, currentDirection);
    const updatedFlashcards = [...studyFlashcards];
    updatedFlashcards[currentCardIndex] = updatedCard;
    setStudyFlashcards(updatedFlashcards);

    await saveFlashcard(updatedCard);

    moveToNextCard();
  };

  const moveToNextCard = () => {
    if (currentCardIndex < studyFlashcards.length - 1) {
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
      
      // Update direction if "both" mode
      if (studyDirection === 'both') {
        setCurrentDirection(Math.random() > 0.5 ? 'en-to-es' : 'es-to-en');
      }
    } else {
      // Study session complete
      Alert.alert('Complete!', 'You have finished studying all selected flashcards!', [
        {
          text: 'OK',
          onPress: () => {
            setIsStudying(false);
            setCurrentCardIndex(0);
            setStudyFlashcards([]);
          },
        },
      ]);
    }
  };

  const togglePileSelection = (pileId: string) => {
    if (selectedPileIds.includes(pileId)) {
      setSelectedPileIds(selectedPileIds.filter(id => id !== pileId));
    } else {
      setSelectedPileIds([...selectedPileIds, pileId]);
    }
  };

  const toggleMasteryLevel = (level: MasteryLevel) => {
    if (selectedMasteryLevels.includes(level)) {
      setSelectedMasteryLevels(selectedMasteryLevels.filter(l => l !== level));
    } else {
      setSelectedMasteryLevels([...selectedMasteryLevels, level]);
    }
  };

  const getCurrentCard = (): Flashcard | null => {
    if (studyFlashcards.length === 0 || currentCardIndex >= studyFlashcards.length) {
      return null;
    }
    return studyFlashcards[currentCardIndex];
  };

  const getCardText = (card: Flashcard, isFront: boolean): string => {
    if (currentDirection === 'en-to-es') {
      return isFront ? card.englishWord : card.spanishWord;
    } else {
      return isFront ? card.spanishWord : card.englishWord;
    }
  };

  if (isStudying) {
    const currentCard = getCurrentCard();
    if (!currentCard) {
      return (
        <View style={styles.container}>
          <Text>No more cards!</Text>
        </View>
      );
    }

    const frontText = getCardText(currentCard, true);
    const backText = getCardText(currentCard, false);

    return (
      <View style={styles.studyContainer}>
        <View style={styles.studyHeader}>
          <TouchableOpacity
            style={styles.exitButton}
            onPress={() => {
              try {
                setIsStudying(false);
                setCurrentCardIndex(0);
                setStudyFlashcards([]);
              } catch (error) {
                console.error('Error exiting study session:', error);
                // Fallback: try to exit anyway
                setIsStudying(false);
              }
            }}
            activeOpacity={0.7}>
            <MaterialIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.progressText}>
            {currentCardIndex + 1} / {studyFlashcards.length}
          </Text>
        </View>

        <FlashcardComponent
          frontText={frontText}
          backText={backText}
          onSuccess={handleSuccess}
          onFailure={handleFailure}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Study Session</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Piles</Text>
          {piles.length === 0 ? (
            <Text style={styles.hintText}>
              No piles available. Create some flashcards first!
            </Text>
          ) : (
            <View style={styles.pileContainer}>
              {piles.map((pile) => (
                <TouchableOpacity
                  key={pile.id}
                  style={[
                    styles.pileButton,
                    selectedPileIds.includes(pile.id) && styles.pileButtonSelected,
                  ]}
                  onPress={() => togglePileSelection(pile.id)}>
                  <MaterialIcons
                    name={selectedPileIds.includes(pile.id) ? 'check-circle' : 'circle'}
                    size={20}
                    color={selectedPileIds.includes(pile.id) ? '#007AFF' : '#8E8E93'}
                  />
                  <Text
                    style={[
                      styles.pileButtonText,
                      selectedPileIds.includes(pile.id) && styles.pileButtonTextSelected,
                    ]}>
                    {pile.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <CategoryFilter
            selectedLevels={selectedMasteryLevels}
            onToggle={toggleMasteryLevel}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Direction</Text>
          <View style={styles.directionContainer}>
            <TouchableOpacity
              style={[
                styles.directionButton,
                studyDirection === 'en-to-es' && styles.directionButtonSelected,
              ]}
              onPress={() => setStudyDirection('en-to-es')}>
              <Text
                style={[
                  styles.directionButtonText,
                  studyDirection === 'en-to-es' && styles.directionButtonTextSelected,
                ]}>
                English → Spanish
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.directionButton,
                studyDirection === 'es-to-en' && styles.directionButtonSelected,
              ]}
              onPress={() => setStudyDirection('es-to-en')}>
              <Text
                style={[
                  styles.directionButtonText,
                  studyDirection === 'es-to-en' && styles.directionButtonTextSelected,
                ]}>
                Spanish → English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.directionButton,
                studyDirection === 'both' && styles.directionButtonSelected,
              ]}
              onPress={() => setStudyDirection('both')}>
              <Text
                style={[
                  styles.directionButtonText,
                  studyDirection === 'both' && styles.directionButtonTextSelected,
                ]}>
                Both
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.startButton,
            (selectedPileIds.length === 0 || selectedMasteryLevels.length === 0) &&
              styles.startButtonDisabled,
          ]}
          onPress={startStudySession}
          disabled={selectedPileIds.length === 0 || selectedMasteryLevels.length === 0}>
          <Text style={styles.startButtonText}>Start Studying</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  pileContainer: {
    gap: 8,
  },
  pileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    gap: 8,
  },
  pileButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  pileButtonText: {
    fontSize: 16,
    color: '#000',
  },
  pileButtonTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  directionContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  directionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  directionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#0051D5',
  },
  directionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  directionButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  startButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  studyContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  studyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  exitButton: {
    padding: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
