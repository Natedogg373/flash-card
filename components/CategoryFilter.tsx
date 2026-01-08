import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MasteryLevel } from '@/types';

interface CategoryFilterProps {
  selectedLevels: MasteryLevel[];
  onToggle: (level: MasteryLevel) => void;
}

export default function CategoryFilter({ selectedLevels, onToggle }: CategoryFilterProps) {
  const levels: MasteryLevel[] = ['learning', 'understanding', 'mastered'];

  const getColor = (level: MasteryLevel) => {
    switch (level) {
      case 'mastered':
        return '#34C759';
      case 'understanding':
        return '#FF9500';
      case 'learning':
        return '#FF3B30';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Filter by Mastery Level:</Text>
      <View style={styles.buttonContainer}>
        {levels.map((level) => {
          const isSelected = selectedLevels.includes(level);
          return (
            <TouchableOpacity
              key={level}
              style={[
                styles.button,
                isSelected && { backgroundColor: getColor(level) },
                isSelected && styles.buttonSelected,
              ]}
              onPress={() => onToggle(level)}>
              <Text
                style={[
                  styles.buttonText,
                  isSelected && styles.buttonTextSelected,
                ]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonSelected: {
    borderColor: '#000',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  buttonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});

