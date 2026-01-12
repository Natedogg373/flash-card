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
import { saveFlashcard, getPiles, savePile, getFlashcards } from '@/services/storage';
import { lookupSpanishTranslation, loadKaikkiData, getDictionaryEntry, getAllDictionaryWords, getSampleWords } from '@/services/translation';
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
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportProgress, setBulkImportProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const [dictionaryLoaded, setDictionaryLoaded] = useState(false);

  const loadData = async () => {
    try {
      console.log('Loading dictionary and piles...');
      await loadKaikkiData();
      setDictionaryLoaded(true);
      console.log('Dictionary loaded, loading piles...');
      
      const loadedPiles = await getPiles();
      setPiles(loadedPiles);
      console.log(`Loaded ${loadedPiles.length} piles`);
      
      const categories = await getAvailableCategories();
      setAvailableCategories(categories);
      console.log(`Loaded ${categories.length} categories`);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load dictionary. Please refresh the app.');
    }
  };

  const handleLookup = async () => {
    if (!englishWord.trim()) {
      Alert.alert('Error', 'Please enter an English word');
      return;
    }

    if (!dictionaryLoaded) {
      Alert.alert('Please Wait', 'Dictionary is still loading. Please try again in a moment.');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Looking up translation for: "${englishWord}"`);
      const translation = lookupSpanishTranslation(englishWord.trim());
      if (translation) {
        console.log(`Found translation: ${translation}`);
        setSpanishWord(translation);
        
        // Get dictionary entry to extract categories
        const entry = getDictionaryEntry(englishWord.trim());
        if (entry) {
          // Auto-create piles based on pos and tags
          await autoCreatePilesFromEntry(entry);
        }
      } else {
        // Get sample of available words to help user
        const sampleWords = getSampleWords(15);
        const sampleText = sampleWords.length > 0 
          ? `\n\nSample words available: ${sampleWords.join(', ')}...`
          : '';
        
        Alert.alert(
          'Translation Not Found',
          `Could not find Spanish translation for "${englishWord}".${sampleText}\n\nTry entering one of the words from the dictionary, or check if the word exists in your JSON file.`
        );
        setSpanishWord(null);
      }
    } catch (error) {
      console.error('Lookup error:', error);
      Alert.alert('Error', 'Failed to lookup translation');
      setSpanishWord(null);
    } finally {
      setIsLoading(false);
    }
  };

  const autoCreatePilesFromEntry = async (entry: any) => {
    const currentPiles = await getPiles();
    const pileMap = new Map(currentPiles.map(p => [p.category, p]));
    const categoriesToCreate: string[] = [];
    
    // Collect all categories from pos and tags
    if (entry.pos && Array.isArray(entry.pos)) {
      entry.pos.forEach((pos: string) => {
        if (!pileMap.has(pos)) {
          categoriesToCreate.push(pos);
        }
      });
    }
    
    if (entry.tags && Array.isArray(entry.tags)) {
      entry.tags.forEach((tag: string) => {
        if (!pileMap.has(tag)) {
          categoriesToCreate.push(tag);
        }
      });
    }
    
    // Create piles for new categories
    const createdPiles: Pile[] = [];
    for (const category of categoriesToCreate) {
      const newPile: Pile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: category.charAt(0).toUpperCase() + category.slice(1), // Capitalize first letter
        category: category,
        createdAt: new Date(),
      };
      await savePile(newPile);
      createdPiles.push(newPile);
      pileMap.set(category, newPile);
    }
    
    // Reload piles
    const updatedPiles = await getPiles();
    setPiles(updatedPiles);
    
    // Auto-select the first relevant pile
    if (entry.pos && entry.pos.length > 0) {
      const posPile = updatedPiles.find(p => p.category === entry.pos[0]);
      if (posPile) {
        setSelectedPileId(posPile.id);
        console.log(`Auto-selected pile: ${posPile.name}`);
        return;
      }
    }
    
    if (entry.tags && entry.tags.length > 0) {
      const tagPile = updatedPiles.find(p => p.category === entry.tags[0]);
      if (tagPile) {
        setSelectedPileId(tagPile.id);
        console.log(`Auto-selected pile: ${tagPile.name}`);
        return;
      }
    }
    
    // If no specific pile found, select the first one if any exist
    if (updatedPiles.length > 0 && !selectedPileId) {
      setSelectedPileId(updatedPiles[0].id);
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

  const handleBulkImport = async () => {
    if (!dictionaryLoaded) {
      Alert.alert('Please Wait', 'Dictionary is still loading. Please try again in a moment.');
      return;
    }

    if (piles.length === 0) {
      Alert.alert('Error', 'Please create at least one pile first');
      return;
    }

    Alert.alert(
      'Bulk Import',
      'This will import all words from the dictionary. This may take a while. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import All',
          onPress: async () => {
            setIsBulkImporting(true);
            try {
              const allEntries = getAllDictionaryWords();
              const existingFlashcards = await getFlashcards();
              const existingWords = new Set(
                existingFlashcards.map(f => `${f.englishWord.toLowerCase()}-${f.spanishWord.toLowerCase()}`)
              );

              setBulkImportProgress({ current: 0, total: allEntries.length });

              let imported = 0;
              let skipped = 0;

              // Group entries by category to assign to appropriate piles
              const categoryPileMap = new Map<string, string>();
              piles.forEach(pile => {
                if (pile.category) {
                  categoryPileMap.set(pile.category.toLowerCase(), pile.id);
                }
              });

              // Get a default pile (first one)
              const defaultPileId = piles[0].id;

              for (let i = 0; i < allEntries.length; i++) {
                const entry = allEntries[i];
                const wordKey = `${entry.en.toLowerCase()}-${entry.es.toLowerCase()}`;

                // Skip if already exists
                if (existingWords.has(wordKey)) {
                  skipped++;
                  setBulkImportProgress({ current: i + 1, total: allEntries.length });
                  continue;
                }

                // Find appropriate pile based on pos or tags
                let targetPileId = defaultPileId;
                if (entry.pos && entry.pos.length > 0) {
                  const posPile = piles.find(p => 
                    p.category && entry.pos.some(pos => pos.toLowerCase() === p.category.toLowerCase())
                  );
                  if (posPile) {
                    targetPileId = posPile.id;
                  }
                } else if (entry.tags && entry.tags.length > 0) {
                  const tagPile = piles.find(p => 
                    p.category && entry.tags.some(tag => tag.toLowerCase() === p.category.toLowerCase())
                  );
                  if (tagPile) {
                    targetPileId = tagPile.id;
                  }
                }

                const flashcard: Flashcard = {
                  id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                  englishWord: entry.en,
                  spanishWord: entry.es,
                  pileId: targetPileId,
                  attempts: [],
                  createdAt: new Date(),
                };

                await saveFlashcard(flashcard);
                existingWords.add(wordKey);
                imported++;
                setBulkImportProgress({ current: i + 1, total: allEntries.length });

                // Small delay to prevent UI freezing
                if (i % 50 === 0) {
                  await new Promise(resolve => setTimeout(resolve, 10));
                }
              }

              setIsBulkImporting(false);
              Alert.alert(
                'Import Complete',
                `Imported ${imported} flashcards. ${skipped} were already in your collection.`
              );
            } catch (error) {
              console.error('Bulk import error:', error);
              setIsBulkImporting(false);
              Alert.alert('Error', 'Failed to import flashcards. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Flashcard</Text>

        {!dictionaryLoaded && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading dictionary...</Text>
          </View>
        )}

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
              editable={dictionaryLoaded}
            />
            <TouchableOpacity
              style={[
                styles.lookupButton,
                (!dictionaryLoaded || isLoading || !englishWord.trim()) && styles.lookupButtonDisabled,
              ]}
              onPress={handleLookup}
              disabled={isLoading || !englishWord.trim() || !dictionaryLoaded}>
              {isLoading ? (
                <ActivityIndicator color="#007AFF" />
              ) : (
                <MaterialIcons 
                  name="search" 
                  size={24} 
                  color={dictionaryLoaded ? "#007AFF" : "#C7C7CC"} 
                />
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

        {spanishWord && !selectedPileId && (
          <View style={styles.warningBox}>
            <MaterialIcons name="info" size={20} color="#FF9500" />
            <Text style={styles.warningText}>
              A pile will be created automatically based on the word's category
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!spanishWord || !selectedPileId) && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveFlashcard}
          disabled={!spanishWord || !selectedPileId}>
          <Text style={styles.saveButtonText}>
            {!spanishWord 
              ? 'Lookup translation first' 
              : !selectedPileId 
              ? 'Select a pile' 
              : 'Save Flashcard'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.label}>Bulk Import</Text>
          <Text style={styles.hintText}>
            Import all words from the dictionary into flashcards automatically.
          </Text>
          {isBulkImporting && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Importing... {bulkImportProgress.current} / {bulkImportProgress.total}
              </Text>
              <ActivityIndicator size="small" color="#007AFF" style={styles.progressIndicator} />
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.bulkImportButton,
              (!dictionaryLoaded || isBulkImporting || piles.length === 0) && styles.bulkImportButtonDisabled,
            ]}
            onPress={handleBulkImport}
            disabled={!dictionaryLoaded || isBulkImporting || piles.length === 0}>
            <MaterialIcons 
              name="cloud-download" 
              size={20} 
              color={(!dictionaryLoaded || isBulkImporting || piles.length === 0) ? "#C7C7CC" : "#fff"} 
            />
            <Text style={styles.bulkImportButtonText}>
              {isBulkImporting 
                ? 'Importing...' 
                : piles.length === 0
                ? 'Create a pile first'
                : 'Import All Words'}
            </Text>
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  lookupButtonDisabled: {
    opacity: 0.5,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9500',
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
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  progressIndicator: {
    marginLeft: 8,
  },
  bulkImportButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  bulkImportButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  bulkImportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

