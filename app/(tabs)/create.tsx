import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { saveFlashcard, getPiles, savePile } from '@/services/storage';
import { lookupSpanishTranslation, loadKaikkiData } from '@/services/translation';
import { Flashcard, Pile } from '@/types';
import { getAvailableCategories } from '@/utils/categories';

export default function CreateScreen() {
  const [englishWord, setEnglishWord] = useState('');
  const [spanishWord, setSpanishWord] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [piles, setPiles] = useState<Pile[]>([]);
  const [selectedPileId, setSelectedPileId] = useState<string | null>(null);
  const [showNewPileForm, setShowNewPileForm] = useState(false);
  const [newPileName, setNewPileName] = useState('');
  const [newPileCategory, setNewPileCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await loadKaikkiData();
    const loadedPiles = await getPiles();
    setPiles(loadedPiles);
    
    const categories = await getAvailableCategories();
    setAvailableCategories(categories);
  };

  const handleLookup = async () => {
    if (!englishWord.trim()) {
      Alert.alert('Error', 'Please enter an English word');
      return;
    }

    setIsLoading(true);
    try {
      const translation = lookupSpanishTranslation(englishWord.trim());
      if (translation) {
        setSpanishWord(translation);
      } else {
        Alert.alert(
          'Translation Not Found',
          `Could not find Spanish translation for "${englishWord}". The word may not be in the dictionary.`
        );
        setSpanishWord(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to lookup translation');
      setSpanishWord(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePile = async () => {
    if (!newPileName.trim()) {
      Alert.alert('Error', 'Please enter a pile name');
      return;
    }

    const newPile: Pile = {
      id: Date.now().toString(),
      name: newPileName.trim(),
      category: newPileCategory || 'general',
      createdAt: new Date(),
    };

    await savePile(newPile);
    const updatedPiles = await getPiles();
    setPiles(updatedPiles);
    setSelectedPileId(newPile.id);
    setShowNewPileForm(false);
    setNewPileName('');
    setNewPileCategory('');
  };

  const handleSaveFlashcard = async () => {
    if (!englishWord.trim()) {
      Alert.alert('Error', 'Please enter an English word');
      return;
    }

    if (!spanishWord) {
      Alert.alert('Error', 'Please lookup the Spanish translation first');
      return;
    }

    if (!selectedPileId) {
      Alert.alert('Error', 'Please select or create a pile');
      return;
    }

    const flashcard: Flashcard = {
      id: Date.now().toString(),
      englishWord: englishWord.trim(),
      spanishWord: spanishWord,
      pileId: selectedPileId,
      attempts: [],
      createdAt: new Date(),
    };

    try {
      await saveFlashcard(flashcard);
      Alert.alert('Success', 'Flashcard created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setEnglishWord('');
            setSpanishWord(null);
            setSelectedPileId(null);
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save flashcard');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Flashcard</Text>

        <View style={styles.section}>
          <Text style={styles.label}>English Word</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={englishWord}
              onChangeText={setEnglishWord}
              placeholder="Enter English word"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.lookupButton}
              onPress={handleLookup}
              disabled={isLoading || !englishWord.trim()}>
              {isLoading ? (
                <ActivityIndicator color="#007AFF" />
              ) : (
                <MaterialIcons name="search" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {spanishWord && (
          <View style={styles.section}>
            <Text style={styles.label}>Spanish Translation</Text>
            <View style={styles.translationBox}>
              <Text style={styles.translationText}>{spanishWord}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.pileHeader}>
            <Text style={styles.label}>Select Pile</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowNewPileForm(!showNewPileForm)}>
              <MaterialIcons
                name={showNewPileForm ? 'close' : 'add'}
                size={24}
                color="#007AFF"
              />
              <Text style={styles.addButtonText}>
                {showNewPileForm ? 'Cancel' : 'New Pile'}
              </Text>
            </TouchableOpacity>
          </View>

          {showNewPileForm && (
            <View style={styles.newPileForm}>
              <TextInput
                style={styles.input}
                value={newPileName}
                onChangeText={setNewPileName}
                placeholder="Pile name (e.g., Foods, Travel)"
              />
              <TextInput
                style={styles.input}
                value={newPileCategory}
                onChangeText={setNewPileCategory}
                placeholder="Category (optional)"
              />
              <TouchableOpacity
                style={styles.createPileButton}
                onPress={handleCreatePile}>
                <Text style={styles.createPileButtonText}>Create Pile</Text>
              </TouchableOpacity>
            </View>
          )}

          {piles.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pileList}>
              {piles.map((pile) => (
                <TouchableOpacity
                  key={pile.id}
                  style={[
                    styles.pileChip,
                    selectedPileId === pile.id && styles.pileChipSelected,
                  ]}
                  onPress={() => setSelectedPileId(pile.id)}>
                  <Text
                    style={[
                      styles.pileChipText,
                      selectedPileId === pile.id && styles.pileChipTextSelected,
                    ]}>
                    {pile.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {piles.length === 0 && !showNewPileForm && (
            <Text style={styles.hintText}>
              No piles yet. Create one to get started!
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!spanishWord || !selectedPileId) && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveFlashcard}
          disabled={!spanishWord || !selectedPileId}>
          <Text style={styles.saveButtonText}>Save Flashcard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#000',
  },
  lookupButton: {
    padding: 8,
  },
  translationBox: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  translationText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  pileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  newPileForm: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  createPileButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  createPileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pileList: {
    marginTop: 8,
  },
  pileChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pileChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#0051D5',
  },
  pileChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  pileChipTextSelected: {
    color: '#fff',
  },
  hintText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

