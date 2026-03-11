import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getFreeStoriesLeft, getMaxFreeStories } from '@/services/creditsService';

const { width, height } = Dimensions.get('window');

function FloatingEmoji({ emoji, delay, left, size }: { emoji: string; delay: number; left: number; size: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -30,
              duration: 2000 + Math.random() * 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 0,
              duration: 2000 + Math.random() * 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };
    animate();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.floatingEmoji,
        {
          left: left,
          fontSize: size,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function HomeScreen() {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  const scaleBtn = useRef(new Animated.Value(0.8)).current;
  const [freeLeft, setFreeLeft] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getFreeStoriesLeft().then(setFreeLeft);
    }, [])
  );

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scaleBtn, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#FF8C42', '#FF6B9D', '#6B4CE6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Floating emojis background */}
        <View style={styles.emojisContainer}>
          <FloatingEmoji emoji="📖" delay={0} left={width * 0.1} size={30} />
          <FloatingEmoji emoji="✨" delay={300} left={width * 0.3} size={24} />
          <FloatingEmoji emoji="🌍" delay={600} left={width * 0.55} size={28} />
          <FloatingEmoji emoji="🦁" delay={200} left={width * 0.75} size={26} />
          <FloatingEmoji emoji="🏝️" delay={500} left={width * 0.15} size={22} />
          <FloatingEmoji emoji="🎭" delay={400} left={width * 0.85} size={24} />
          <FloatingEmoji emoji="⭐" delay={700} left={width * 0.45} size={20} />
        </View>

        {/* Header buttons */}
        <View style={styles.headerRow}>
          <View style={{ width: 44 }} />
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeIn,
              transform: [{ translateY: slideUp }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>📚</Text>
            <Text style={styles.logoText}>Edem</Text>
            <Text style={styles.tagline}>Crée tes propres histoires magiques !</Text>
          </View>

          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              Deviens le héros{'\n'}de ton histoire
            </Text>
            <Text style={styles.heroSubtitle}>
              Réponds aux questions, prends-toi en photo{'\n'}et laisse la magie opérer ! ✨
            </Text>
          </View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View
          style={[styles.buttonsContainer, { transform: [{ scale: scaleBtn }] }]}
        >
          <TouchableOpacity
            style={styles.mainButton}
            activeOpacity={0.85}
            onPress={() => router.push('/create/photo')}
          >
            <LinearGradient
              colors={['#FFD93D', '#FF8C42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainButtonGradient}
            >
              <MaterialCommunityIcons name="book-plus" size={32} color="#2D1B0E" />
              <Text style={styles.mainButtonText}>Créer une histoire</Text>
              <Text style={styles.mainButtonSubtext}>C'est parti pour l'aventure !</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Credits badge */}
          {freeLeft > 0 ? (
            <View style={styles.creditsBadge}>
              <Ionicons name="sparkles" size={16} color="#FFD93D" />
              <Text style={styles.creditsText}>
                {freeLeft} histoire{freeLeft > 1 ? 's' : ''} IA gratuite{freeLeft > 1 ? 's' : ''} restante{freeLeft > 1 ? 's' : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.creditsBadge}>
              <Ionicons name="infinite" size={16} color="rgba(255,255,255,0.6)" />
              <Text style={[styles.creditsText, { color: 'rgba(255,255,255,0.5)' }]}>
                Mode gratuit illimité
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => router.push('/library')}
          >
            <Ionicons name="library-outline" size={24} color="white" />
            <Text style={styles.secondaryButtonText}>Mes histoires</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom decoration */}
        <View style={styles.bottomDecoration}>
          <Text style={styles.bottomText}>
            Des héros qui te ressemblent 🌟
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  emojisContainer: {
    ...StyleSheet.absoluteFillObject,
    top: 60,
  },
  floatingEmoji: {
    position: 'absolute',
    top: Math.random() * height * 0.3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 52,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
    fontWeight: '600',
  },
  heroSection: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    lineHeight: 34,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  buttonsContainer: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  mainButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    marginBottom: 14,
  },
  mainButtonGradient: {
    paddingVertical: 22,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  mainButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D1B0E',
    marginTop: 8,
  },
  mainButtonSubtext: {
    fontSize: 13,
    color: '#8B6F47',
    marginTop: 4,
    fontWeight: '500',
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 14,
  },
  creditsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD93D',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 10,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  bottomDecoration: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  bottomText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
});
