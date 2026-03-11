import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { regions } from '@/constants/Regions';
import { generateStory } from '@/services/storyGenerator';
import { generateAllIllustrations } from '@/services/imageService';
import { saveStory } from '@/services/storageService';
import { StoryAnswers } from '@/types';
import { OPENAI_API_KEY } from '@/constants/Config';
import { canUseAI, incrementStoriesCreated } from '@/services/creditsService';
import { createCartoonAvatar } from '@/services/avatarService';

const LOADING_MESSAGES = [
  { text: 'Préparation de la magie...', emoji: '✨' },
  { text: 'Convocation des ancêtres...', emoji: '🌍' },
  { text: 'Tissage de l\'histoire...', emoji: '🧶' },
  { text: 'Dessin des illustrations...', emoji: '🎨' },
  { text: 'Ajout des couleurs...', emoji: '🖌️' },
  { text: 'Mise en page de la BD...', emoji: '📰' },
  { text: 'Préparation de la voix...', emoji: '🎙️' },
  { text: 'Presque prêt...', emoji: '📖' },
];

export default function LoadingScreen() {
  const params = useLocalSearchParams<{
    photoUri: string;
    regionId: string;
    answers: string;
  }>();

  const [messageIndex, setMessageIndex] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const messageAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(messageAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        Animated.timing(messageAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const generate = async () => {
      try {
        const parsedAnswers = JSON.parse(params.answers || '{}');
        const selectedRegion = regions.find((r) => r.id === params.regionId) || regions[0];
        const hasApiKey = OPENAI_API_KEY && OPENAI_API_KEY !== 'VOTRE_CLE_API_ICI';
        const hasCredits = await canUseAI();
        const useAI = hasApiKey && hasCredits;
        const apiKey = useAI ? OPENAI_API_KEY : null;

        const storyAnswers: StoryAnswers = {
          heroName: parsedAnswers.heroName || 'Ayo',
          region: selectedRegion,
          heroTrait: parsedAnswers.heroTrait || 'le courage',
          setting: parsedAnswers.setting || 'une forêt enchantée',
          companion: parsedAnswers.companion || 'un chat magique',
          challenge: parsedAnswers.challenge || 'retrouver un trésor perdu',
          power: parsedAnswers.power || 'un collier ancestral',
          moral: parsedAnswers.moral || 'Croire en soi',
          photoUri: params.photoUri || undefined,
        };

        setProgressLabel(useAI ? 'L\'IA écrit ton histoire...' : 'Écriture de l\'histoire...');
        Animated.timing(progressAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: false,
        }).start();

        const story = await generateStory(storyAnswers, apiKey || undefined);

        if (useAI) {
          await incrementStoriesCreated();
        }

        // Step 2: Create cartoon avatar from user photo
        setProgressLabel('Transformation en personnage...');
        Animated.timing(progressAnim, {
          toValue: 0.4,
          duration: 500,
          useNativeDriver: false,
        }).start();

        let characterDescription = '';
        try {
          const avatarResult = await createCartoonAvatar(
            storyAnswers.photoUri,
            storyAnswers,
            story.id
          );
          story.avatarUri = avatarResult.avatarUri;
          story.characterDescription = avatarResult.description;
          characterDescription = avatarResult.description;
          console.log('Avatar result:', avatarResult.avatarUri ? 'OK' : 'no image', '| desc:', avatarResult.description.slice(0, 50));
        } catch (err) {
          console.warn('Avatar generation error (non-fatal):', err);
        }

        // Step 3: Generate illustrations with character consistency
        setProgressLabel('Création des illustrations...');
        Animated.timing(progressAnim, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: false,
        }).start();

        try {
          const imageUris = await generateAllIllustrations(
            story.chapters,
            storyAnswers,
            story.id,
            apiKey || undefined,
            (done, total) => {
              const progress = 0.5 + (done / total) * 0.4;
              Animated.timing(progressAnim, {
                toValue: progress,
                duration: 300,
                useNativeDriver: false,
              }).start();
              setProgressLabel(`Illustration ${done + 1}/${total}...`);
            },
            characterDescription
          );

          const successCount = imageUris.filter(Boolean).length;
          console.log(`Illustrations: ${successCount}/${story.chapters.length} generated`);

          story.chapters = story.chapters.map((ch, i) => ({
            ...ch,
            imageUri: imageUris[i],
          }));
        } catch (err) {
          console.warn('Illustration generation error (non-fatal):', err);
        }

        // Step 4: Save
        setProgressLabel('Finalisation...');
        Animated.timing(progressAnim, {
          toValue: 0.95,
          duration: 500,
          useNativeDriver: false,
        }).start();

        await saveStory(story);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        router.replace({
          pathname: '/create/story',
          params: { storyId: story.id },
        });
      } catch (error) {
        console.error('Story generation error:', error);
        router.back();
      }
    };

    generate();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const currentMessage = LOADING_MESSAGES[messageIndex];

  return (
    <LinearGradient
      colors={['#2D1B0E', '#6B4CE6', '#FF6B9D']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Animated magic book */}
          <Animated.View
            style={[
              styles.magicCircle,
              {
                transform: [{ rotate: spin }, { scale: pulseAnim }],
              },
            ]}
          >
            <Text style={styles.magicEmoji}>📖</Text>
          </Animated.View>

          {/* Stars */}
          <View style={styles.starsRow}>
            {['⭐', '✨', '🌟', '✨', '⭐'].map((star, i) => (
              <Animated.Text
                key={i}
                style={[styles.star, { opacity: pulseAnim, transform: [{ scale: pulseAnim }] }]}
              >
                {star}
              </Animated.Text>
            ))}
          </View>

          {/* Loading message */}
          <Animated.View style={[styles.messageContainer, { opacity: messageAnim }]}>
            <Text style={styles.messageEmoji}>{currentMessage.emoji}</Text>
            <Text style={styles.messageText}>{currentMessage.text}</Text>
          </Animated.View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth as any }]}
              />
            </View>
            {progressLabel ? (
              <Text style={styles.progressLabel}>{progressLabel}</Text>
            ) : null}
          </View>

          <Text style={styles.tipText}>
            Ton histoire illustrée est en préparation...{'\n'}
            Tu pourras l'écouter et la lire comme une BD ! 🎨🎧
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  magicCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,217,61,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,217,61,0.3)',
    marginBottom: 30,
  },
  magicEmoji: { fontSize: 60 },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  star: { fontSize: 20 },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  messageEmoji: { fontSize: 36, marginBottom: 10 },
  messageText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD93D',
    borderRadius: 5,
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 21,
  },
});
