import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getPiles, savePile, deletePile, getFlashcardsByPile } from '@/services/storage';
import { Pile } from '@/types';
import { getAvailableCategories } from '@/utils/categories';

export default function PilesScreen() {
  const [piles, setPiles] = useState<Pile[]>([]);
  const [showNewPileForm, setShowNewPileForm] = useState(false);
  const [newPileName, setNewPileName] = useState('');
  const [newPileCategory, setNewPileCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [editingPileId, setEditingPileId] = useState<string | null>(null);
  const [editingPileName, setEditingPileName] = useState('');

  useEffect(() => {
    loadPiles();
  }, []);

  const loadPiles = async () => {
    const loadedPiles = await getPiles();
    setPiles(loadedPiles);
    
    const categories = await getAvailableCategories();
    setAvailableCategories(categories);
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
    await loadPiles();
    setShowNewPileForm(false);
    setNewPileName('');
    setNewPileCategory('');
  };

  const handleDeletePile = async (pileId: string) => {
    const flashcards = await getFlashcardsByPile(pileId);
    
    Alert.alert(
      'Delete Pile',
      `Are you sure you want to delete this pile? ${flashcards.length} flashcard(s) will also be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePile(pileId);
            await loadPiles();
          },
        },
      ]
    );
  };

  const handleStartEdit = (pile: Pile) => {
    setEditingPileId(pile.id);
    setEditingPileName(pile.name);
  };

  const handleSaveEdit = async (pileId: string) => {
    if (!editingPileName.trim()) {
      Alert.alert('Error', 'Pile name cannot be empty');
      return;
    }

    const pile = piles.find(p => p.id === pileId);
    if (pile) {
      const updatedPile: Pile = {
        ...pile,
        name: editingPileName.trim(),
      };
      await savePile(updatedPile);
      await loadPiles();
      setEditingPileId(null);
      setEditingPileName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingPileId(null);
    setEditingPileName('');
  };

  const renderPile = ({ item }: { item: Pile }) => {
    const isEditing = editingPileId === item.id;
    const flashcardsCount = 0; // Could be enhanced to show actual count

    return (
      <View style={styles.pileCard}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editingPileName}
              onChangeText={setEditingPileName}
              autoFocus
            />
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={styles.saveEditButton}
                onPress={() => handleSaveEdit(item.id)}>
                <MaterialIcons name="check" size={20} color="#34C759" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelEditButton}
                onPress={handleCancelEdit}>
                <MaterialIcons name="close" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.pileInfo}>
              <Text style={styles.pileName}>{item.name}</Text>
              <Text style={styles.pileCategory}>{item.category}</Text>
              <Text style={styles.pileDate}>
                Created: {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.pileActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleStartEdit(item)}>
                <MaterialIcons name="edit" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeletePile(item.id)}>
                <MaterialIcons name="delete" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Piles</Text>
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
          <Text style={styles.formTitle}>Create New Pile</Text>
          <TextInput
            style={styles.input}
            value={newPileName}
            onChangeText={setNewPileName}
            placeholder="Pile name (e.g., Foods, Travel, Verbs)"
          />
          <TextInput
            style={styles.input}
            value={newPileCategory}
            onChangeText={setNewPileCategory}
            placeholder="Category (optional)"
          />
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreatePile}>
            <Text style={styles.createButtonText}>Create Pile</Text>
          </TouchableOpacity>
        </View>
      )}

      {piles.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="folder-open" size={64} color="#C7C7CC" />
          <Text style={styles.emptyStateText}>No piles yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Create your first pile to organize flashcards
          </Text>
        </View>
      ) : (
        <FlatList
          data={piles}
          renderItem={renderPile}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
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
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#000',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 20,
  },
  pileCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pileInfo: {
    flex: 1,
  },
  pileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  pileCategory: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  pileDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  pileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    color: '#000',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  saveEditButton: {
    padding: 8,
  },
  cancelEditButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
});

