import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MasteryLevel } from '@/types';

interface ProgressBarProps {
  masteryLevel: MasteryLevel;
  successRate: number;
  attemptCount: number;
}

export default function ProgressBar({ masteryLevel, successRate, attemptCount }: ProgressBarProps) {
  const getColor = () => {
    switch (masteryLevel) {
      case 'mastered':
        return '#34C759';
      case 'understanding':
        return '#FF9500';
      case 'learning':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{masteryLevel.toUpperCase()}</Text>
        <Text style={styles.stats}>
          {Math.round(successRate * 100)}% ({attemptCount}/10)
        </Text>
      </View>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.bar,
            { width: `${successRate * 100}%`, backgroundColor: getColor() },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  stats: {
    fontSize: 12,
    color: '#8E8E93',
  },
  barContainer: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
});

