import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getFreeStoriesLeft, getMaxFreeStories } from '@/services/creditsService';

export default function SettingsScreen() {
  const [freeLeft, setFreeLeft] = useState(0);
  const maxFree = getMaxFreeStories();

  useFocusEffect(
    useCallback(() => {
      getFreeStoriesLeft().then(setFreeLeft);
    }, [])
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paramètres</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* About section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="information" size={22} color={Colors.secondary} />
              <Text style={styles.sectionTitle}>À propos d'Edem</Text>
            </View>
            <Text style={styles.aboutText}>
              Edem est une application de création d'histoires pour enfants, mettant en valeur
              les héros afro-descendants du monde entier : Caraïbes, Afrique, États-Unis,
              Europe, Océan Indien et bien plus.
            </Text>
            <Text style={styles.aboutText}>
              Chaque enfant mérite de se voir représenté dans des histoires magiques et inspirantes. 🌟
            </Text>
          </View>

          {/* Credits section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={22} color="#FFD93D" />
              <Text style={styles.sectionTitle}>Histoires IA</Text>
            </View>
            <View style={styles.creditsContainer}>
              <View style={styles.creditsRow}>
                <Text style={styles.creditsNumber}>{freeLeft}</Text>
                <Text style={styles.creditsLabel}>/ {maxFree} histoires IA gratuites restantes</Text>
              </View>
              <View style={styles.creditsBar}>
                <View style={[styles.creditsBarFill, { width: `${(freeLeft / maxFree) * 100}%` }]} />
              </View>
              <Text style={styles.creditsInfo}>
                {freeLeft > 0
                  ? `Tes ${maxFree} premières histoires utilisent l'IA pour le texte, les illustrations et la voix premium.`
                  : 'Tu as utilisé tes histoires IA gratuites. Tu peux continuer à créer des histoires en mode gratuit avec des histoires pré-écrites et la voix Google.'}
              </Text>
            </View>
          </View>

          {/* Features section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="star-four-points" size={22} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Fonctionnalités</Text>
            </View>

            <View style={styles.featureList}>
              <View style={styles.featureRow}>
                <Text style={styles.featureEmoji}>📸</Text>
                <Text style={styles.featureText}>Prends-toi en photo pour devenir le héros</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureEmoji}>🌍</Text>
                <Text style={styles.featureText}>Choisis l'origine de ton personnage</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureEmoji}>✨</Text>
                <Text style={styles.featureText}>L'IA crée une histoire unique pour toi</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureEmoji}>🎨</Text>
                <Text style={styles.featureText}>Des illustrations générées pour chaque chapitre</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureEmoji}>🎧</Text>
                <Text style={styles.featureText}>Écoute ton histoire avec une voix IA</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureEmoji}>🎬</Text>
                <Text style={styles.featureText}>Partage ton histoire en vidéo</Text>
              </View>
            </View>
          </View>

          <View style={styles.versionSection}>
            <Text style={styles.versionText}>Edem v1.0.0</Text>
            <Text style={styles.madeWith}>Fait avec ❤️ pour nos enfants</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 10,
  },
  creditsContainer: {
    gap: 12,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  creditsNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFD93D',
  },
  creditsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  creditsBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  creditsBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FFD93D',
  },
  creditsInfo: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  featureList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureEmoji: {
    fontSize: 22,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    lineHeight: 20,
  },
  versionSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  versionText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  madeWith: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
});
