import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storyQuestions } from '@/constants/Questions';
import { regions } from '@/constants/Regions';
import { StoryChoice } from '@/types';

const { width } = Dimensions.get('window');

const GRADIENTS: [string, string][] = [
  ['#6B4CE6', '#FF6B9D'],
  ['#FF8C42', '#FF6B9D'],
  ['#10B981', '#6EC6FF'],
  ['#6B4CE6', '#6EC6FF'],
  ['#FF6B9D', '#FFD93D'],
  ['#FF8C42', '#FFD93D'],
  ['#10B981', '#4ADE80'],
];

function ChoiceCard({
  choice,
  selected,
  onPress,
  index,
}: {
  choice: StoryChoice;
  selected: boolean;
  onPress: () => void;
  index: number;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 60,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.choiceCard, selected && styles.choiceCardSelected]}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <Text style={styles.choiceEmoji}>{choice.emoji}</Text>
        <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
          {choice.label}
        </Text>
        {selected && (
          <View style={styles.choiceCheck}>
            <Ionicons name="checkmark-circle" size={24} color="#FFD93D" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function QuestionsScreen() {
  const params = useLocalSearchParams<{ photoUri: string; regionId: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textValue, setTextValue] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = storyQuestions[currentIndex];
  const totalQuestions = storyQuestions.length;
  const progress = (currentIndex + 1) / totalQuestions;
  const gradient = GRADIENTS[currentIndex % GRADIENTS.length];

  const selectedRegion = regions.find((r) => r.id === params.regionId) || regions[0];

  const animateTransition = (direction: 'next' | 'prev', callback: () => void) => {
    const outValue = direction === 'next' ? -width : width;
    const inValue = direction === 'next' ? width : -width;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: outValue * 0.3, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(inValue * 0.3);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleChoice = (choice: StoryChoice) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: choice.value }));
  };

  const handleNext = () => {
    if (currentQuestion.type === 'text') {
      if (!textValue.trim()) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: textValue.trim() }));
    }

    if (currentIndex < totalQuestions - 1) {
      animateTransition('next', () => {
        setCurrentIndex((i) => i + 1);
        setTextValue('');
      });
    } else {
      router.push({
        pathname: '/create/loading',
        params: {
          photoUri: params.photoUri || '',
          regionId: params.regionId,
          answers: JSON.stringify({
            ...answers,
            ...(currentQuestion.type === 'text' ? { [currentQuestion.id]: textValue.trim() } : {}),
          }),
        },
      });
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      animateTransition('prev', () => {
        setCurrentIndex((i) => i - 1);
        setTextValue('');
      });
    } else {
      router.back();
    }
  };

  const isAnswered =
    currentQuestion.type === 'text'
      ? textValue.trim().length > 0
      : !!answers[currentQuestion.id];

  return (
    <LinearGradient colors={gradient} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.stepText}>Étape 3/3</Text>
            <Text style={styles.counterText}>
              {currentIndex + 1}/{totalQuestions}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <Animated.View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
          </View>

          {/* Question content */}
          <Animated.View
            style={[
              styles.questionContent,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
              {currentQuestion.subtitle && (
                <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text>
              )}

              {currentQuestion.type === 'text' ? (
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={textValue}
                    onChangeText={setTextValue}
                    placeholder="Écris ici..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    maxLength={30}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleNext}
                  />
                  <Text style={styles.charCount}>{textValue.length}/30</Text>
                </View>
              ) : (
                <View style={styles.choicesGrid}>
                  {currentQuestion.choices.map((choice, index) => (
                    <ChoiceCard
                      key={choice.id}
                      choice={choice}
                      index={index}
                      selected={answers[currentQuestion.id] === choice.value}
                      onPress={() => handleChoice(choice)}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>

          {/* Next button */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.nextButton, !isAnswered && styles.nextButtonDisabled]}
              onPress={handleNext}
              activeOpacity={0.85}
              disabled={!isAnswered}
            >
              <Text style={[styles.nextText, !isAnswered && { opacity: 0.5 }]}>
                {currentIndex === totalQuestions - 1 ? 'Créer mon histoire !' : 'Suivant'}
              </Text>
              <Ionicons
                name={currentIndex === totalQuestions - 1 ? 'sparkles' : 'arrow-forward'}
                size={22}
                color={isAnswered ? '#2D1B0E' : 'rgba(255,255,255,0.5)'}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  counterText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressContainer: {
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  progressBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD93D',
    borderRadius: 4,
  },
  questionContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 20,
  },
  questionText: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 6,
  },
  questionSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: 24,
  },
  textInputContainer: {
    marginTop: 10,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  charCount: {
    textAlign: 'right',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 6,
    marginRight: 10,
  },
  choicesGrid: {
    gap: 10,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  choiceCardSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: '#FFD93D',
  },
  choiceEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  choiceLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  choiceLabelSelected: {
    color: 'white',
  },
  choiceCheck: {
    marginLeft: 8,
  },
  bottomBar: {
    paddingHorizontal: 30,
    paddingBottom: 20,
    paddingTop: 10,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD93D',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    elevation: 0,
    shadowOpacity: 0,
  },
  nextText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D1B0E',
  },
});
