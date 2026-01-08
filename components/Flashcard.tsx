import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface FlashcardProps {
  frontText: string;
  backText: string;
  onSuccess: () => void;
  onFailure: () => void;
  showButtons?: boolean;
}

export default function Flashcard({
  frontText,
  backText,
  onSuccess,
  onFailure,
  showButtons = true,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));

  const flipCard = () => {
    if (isFlipped) return;
    
    Animated.spring(flipAnimation, {
      toValue: 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    
    setIsFlipped(true);
  };

  const resetCard = () => {
    setIsFlipped(false);
    Animated.spring(flipAnimation, {
      toValue: 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
    opacity: flipAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0, 0],
    }),
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
    opacity: flipAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
    }),
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {/* Front of card */}
        <Animated.View
          style={[
            styles.card,
            styles.cardFront,
            frontAnimatedStyle,
          ]}
          pointerEvents={isFlipped ? 'none' : 'auto'}>
          <TouchableOpacity
            style={styles.cardContent}
            onPress={flipCard}
            activeOpacity={0.9}>
            <Text style={styles.cardText}>{frontText}</Text>
            <Text style={styles.hintText}>Tap to flip</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Back of card */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            backAnimatedStyle,
          ]}
          pointerEvents={!isFlipped ? 'none' : 'auto'}>
          <View style={styles.cardContent}>
            <Text style={styles.cardText}>{backText}</Text>
            {showButtons && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.failureButton]}
                  onPress={() => {
                    onFailure();
                    resetCard();
                  }}>
                  <MaterialIcons name="close" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Wrong</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.successButton]}
                  onPress={() => {
                    onSuccess();
                    resetCard();
                  }}>
                  <MaterialIcons name="check" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Correct</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    height: 300,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardFront: {
    backgroundColor: '#007AFF',
  },
  cardBack: {
    backgroundColor: '#34C759',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  hintText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    gap: 8,
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  failureButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

