import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getFlashcards, getPiles } from '@/services/storage';
import { calculateMasteryLevel, getSuccessRate, getSuccessCount } from '@/services/progress';
import { Flashcard, Pile, MasteryLevel } from '@/types';
import ProgressBar from '@/components/ProgressBar';
import CategoryFilter from '@/components/CategoryFilter';

export default function ProgressScreen() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [piles, setPiles] = useState<Pile[]>([]);
  const [selectedPileId, setSelectedPileId] = useState<string | null>(null);
  const [selectedMasteryLevels, setSelectedMasteryLevels] = useState<MasteryLevel[]>(['learning', 'understanding', 'mastered']);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedFlashcards = await getFlashcards();
    setFlashcards(loadedFlashcards);
    const loadedPiles = await getPiles();
    setPiles(loadedPiles);
  };

  const getFilteredFlashcards = (): Flashcard[] => {
    let filtered = flashcards;

    if (selectedPileId) {
      filtered = filtered.filter(f => f.pileId === selectedPileId);
    }

    filtered = filtered.filter(f => {
      const mastery = calculateMasteryLevel(f);
      return selectedMasteryLevels.includes(mastery);
    });

    return filtered.sort((a, b) => {
      // Sort by mastery level, then by name
      const masteryA = calculateMasteryLevel(a);
      const masteryB = calculateMasteryLevel(b);
      const masteryOrder = { learning: 0, understanding: 1, mastered: 2 };
      
      if (masteryOrder[masteryA] !== masteryOrder[masteryB]) {
        return masteryOrder[masteryA] - masteryOrder[masteryB];
      }
      
      return a.englishWord.localeCompare(b.englishWord);
    });
  };

  const toggleMasteryLevel = (level: MasteryLevel) => {
    if (selectedMasteryLevels.includes(level)) {
      setSelectedMasteryLevels(selectedMasteryLevels.filter(l => l !== level));
    } else {
      setSelectedMasteryLevels([...selectedMasteryLevels, level]);
    }
  };

  const getPileName = (pileId: string): string => {
    const pile = piles.find(p => p.id === pileId);
    return pile ? pile.name : 'Unknown';
  };

  const getMasteryStats = () => {
    const mastered = flashcards.filter(f => calculateMasteryLevel(f) === 'mastered').length;
    const understanding = flashcards.filter(f => calculateMasteryLevel(f) === 'understanding').length;
    const learning = flashcards.filter(f => calculateMasteryLevel(f) === 'learning').length;
    
    return { mastered, understanding, learning, total: flashcards.length };
  };

  const renderFlashcard = ({ item }: { item: Flashcard }) => {
    const mastery = calculateMasteryLevel(item);
    const successRate = getSuccessRate(item);
    const successCount = getSuccessCount(item);
    const attemptCount = item.attempts.length;
    const isExpanded = expandedCardId === item.id;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedCardId(isExpanded ? null : item.id)}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardWord}>{item.englishWord}</Text>
            <Text style={styles.cardTranslation}>{item.spanishWord}</Text>
            <Text style={styles.cardPile}>{getPileName(item.pileId)}</Text>
          </View>
          <View style={styles.cardStats}>
            <View
              style={[
                styles.masteryBadge,
                { backgroundColor: getMasteryColor(mastery) },
              ]}>
              <Text style={styles.masteryBadgeText}>{mastery.toUpperCase()}</Text>
            </View>
            <MaterialIcons
              name={isExpanded ? 'expand-less' : 'expand-more'}
              size={24}
              color="#8E8E93"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.cardContent}>
          <ProgressBar
            masteryLevel={mastery}
            successRate={successRate}
            attemptCount={Math.min(attemptCount, 10)}
          />

          {isExpanded && (
            <View style={styles.expandedContent}>
              <Text style={styles.attemptsTitle}>Last 10 Attempts:</Text>
              {item.attempts.length === 0 ? (
                <Text style={styles.noAttemptsText}>No attempts yet</Text>
              ) : (
                <View style={styles.attemptsList}>
                  {item.attempts.slice(-10).reverse().map((attempt, index) => (
                    <View key={index} style={styles.attemptItem}>
                      <MaterialIcons
                        name={attempt.success ? 'check-circle' : 'cancel'}
                        size={20}
                        color={attempt.success ? '#34C759' : '#FF3B30'}
                      />
                      <Text style={styles.attemptText}>
                        {attempt.direction === 'en-to-es' ? 'EN → ES' : 'ES → EN'}
                      </Text>
                      <Text style={styles.attemptDate}>
                        {new Date(attempt.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const getMasteryColor = (mastery: MasteryLevel): string => {
    switch (mastery) {
      case 'mastered':
        return '#34C759';
      case 'understanding':
        return '#FF9500';
      case 'learning':
        return '#FF3B30';
    }
  };

  const stats = getMasteryStats();
  const filteredFlashcards = getFilteredFlashcards();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Progress</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Cards</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#34C759' }]}>
              {stats.mastered}
            </Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#FF9500' }]}>
              {stats.understanding}
            </Text>
            <Text style={styles.statLabel}>Understanding</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#FF3B30' }]}>
              {stats.learning}
            </Text>
            <Text style={styles.statLabel}>Learning</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter by Pile</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pileList}>
            <TouchableOpacity
              style={[
                styles.pileChip,
                selectedPileId === null && styles.pileChipSelected,
              ]}
              onPress={() => setSelectedPileId(null)}>
              <Text
                style={[
                  styles.pileChipText,
                  selectedPileId === null && styles.pileChipTextSelected,
                ]}>
                All
              </Text>
            </TouchableOpacity>
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
        </View>

        <View style={styles.section}>
          <CategoryFilter
            selectedLevels={selectedMasteryLevels}
            onToggle={toggleMasteryLevel}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Flashcards ({filteredFlashcards.length})
          </Text>
          {filteredFlashcards.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={64} color="#C7C7CC" />
              <Text style={styles.emptyStateText}>No flashcards found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your filters
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredFlashcards}
              renderItem={renderFlashcard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
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
    marginBottom: 20,
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
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
  card: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardWord: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  cardTranslation: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 4,
  },
  cardPile: {
    fontSize: 12,
    color: '#8E8E93',
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  masteryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  masteryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  cardContent: {
    padding: 16,
    paddingTop: 0,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  attemptsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  noAttemptsText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  attemptsList: {
    gap: 8,
  },
  attemptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attemptText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  attemptDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
});

