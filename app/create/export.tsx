import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getStory } from '@/services/storageService';
import { generateAllChapterAudios } from '@/services/ttsService';
import { exportStoryAsVideo, shareStoryVideo } from '@/services/videoExportService';
import { GeneratedStory } from '@/types';
import { OPENAI_API_KEY } from '@/constants/Config';

type ExportStep = 'idle' | 'audio' | 'building' | 'done' | 'error';

export default function ExportScreen() {
  const params = useLocalSearchParams<{ storyId: string }>();
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [step, setStep] = useState<ExportStep>('idle');
  const [progress, setProgress] = useState('');
  const [exportPath, setExportPath] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadStory();
    checkApiKey();
  }, []);

  useEffect(() => {
    if (step === 'audio' || step === 'building') {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [step]);

  const loadStory = async () => {
    if (params.storyId) {
      const s = await getStory(params.storyId);
      setStory(s);
    }
  };

  const checkApiKey = async () => {
    setHasApiKey(!!OPENAI_API_KEY && OPENAI_API_KEY !== 'VOTRE_CLE_API_ICI');
  };

  const startExport = async () => {
    if (!story) return;
    const apiKey = OPENAI_API_KEY && OPENAI_API_KEY !== 'VOTRE_CLE_API_ICI' ? OPENAI_API_KEY : null;

    try {
      let audioUris: (string | undefined)[] = [];

      // Generate TTS audio if API key available
      if (apiKey) {
        setStep('audio');
        setProgress('Génération de la voix...');

        audioUris = await generateAllChapterAudios(
          story.chapters,
          story.id,
          apiKey,
          (done, total) => {
            setProgress(`Enregistrement vocal ${done + 1}/${total}...`);
          }
        );
      }

      // Build HTML video
      setStep('building');
      setProgress('Assemblage de la vidéo...');

      const filePath = await exportStoryAsVideo(story, audioUris, (stepMsg) => {
        setProgress(stepMsg);
      });

      setExportPath(filePath);
      setStep('done');
    } catch (error) {
      console.error('Export error:', error);
      setStep('error');
      Alert.alert('Erreur', 'Impossible de créer la vidéo. Réessaie !');
    }
  };

  const handleShare = async () => {
    if (exportPath) {
      await shareStoryVideo(exportPath);
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partager</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.content}>
          {step === 'idle' && (
            <View style={styles.idleContent}>
              <View style={styles.previewCard}>
                <LinearGradient
                  colors={[story?.coverColor || Colors.primary, '#2D1B0E']}
                  style={styles.previewGradient}
                >
                  <Text style={styles.previewEmoji}>🎬</Text>
                  <Text style={styles.previewTitle}>{story?.title}</Text>
                  <Text style={styles.previewSub}>
                    {story?.chapters.length} chapitres illustrés
                  </Text>
                </LinearGradient>
              </View>

              <Text style={styles.explainTitle}>Créer une vidéo de ton histoire</Text>
              <Text style={styles.explainText}>
                Ton histoire sera transformée en un livre animé avec les illustrations
                et une voix qui raconte l'histoire. Tu pourras ensuite le partager !
              </Text>

              {/* What's included */}
              <View style={styles.featureList}>
                <View style={styles.featureRow}>
                  <View style={[styles.featureDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.featureText}>Illustrations de chaque chapitre</Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={[styles.featureDot, { backgroundColor: hasApiKey ? Colors.success : Colors.warning }]} />
                  <Text style={styles.featureText}>
                    Voix IA narration {hasApiKey ? '(activée)' : '(clé API requise)'}
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={[styles.featureDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.featureText}>Partageable par message / réseaux</Text>
                </View>
              </View>

              {!hasApiKey && (
                <View style={styles.warningBox}>
                  <Ionicons name="information-circle" size={18} color={Colors.warning} />
                  <Text style={styles.warningText}>
                    Sans clé API OpenAI, la vidéo sera sans voix. Ajoute ta clé dans les Paramètres pour activer la narration vocale IA.
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.exportButton} onPress={startExport}>
                <LinearGradient
                  colors={['#FFD93D', '#FF8C42']}
                  style={styles.exportGradient}
                >
                  <FontAwesome5 name="film" size={20} color="#2D1B0E" />
                  <Text style={styles.exportText}>Créer la vidéo</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {(step === 'audio' || step === 'building') && (
            <View style={styles.processingContent}>
              <Animated.View
                style={[styles.processingIcon, { transform: [{ rotate: spin }, { scale: pulseAnim }] }]}
              >
                <Text style={styles.processingEmoji}>
                  {step === 'audio' ? '🎙️' : '🎬'}
                </Text>
              </Animated.View>

              <Text style={styles.processingTitle}>
                {step === 'audio' ? 'Enregistrement vocal...' : 'Montage en cours...'}
              </Text>
              <Text style={styles.processingProgress}>{progress}</Text>

              <View style={styles.processingSteps}>
                <View style={styles.pStep}>
                  <Ionicons
                    name={step === 'audio' || step === 'building' ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={Colors.success}
                  />
                  <Text style={styles.pStepText}>Histoire écrite</Text>
                </View>
                <View style={styles.pStep}>
                  <Ionicons
                    name={step === 'building' ? 'checkmark-circle' : 'time-outline'}
                    size={20}
                    color={step === 'building' ? Colors.success : Colors.warning}
                  />
                  <Text style={styles.pStepText}>Narration vocale</Text>
                </View>
                <View style={styles.pStep}>
                  <Ionicons
                    name={step === 'building' ? 'time-outline' : 'ellipse-outline'}
                    size={20}
                    color={step === 'building' ? Colors.warning : Colors.textMuted}
                  />
                  <Text style={styles.pStepText}>Montage vidéo</Text>
                </View>
              </View>
            </View>
          )}

          {step === 'done' && (
            <View style={styles.doneContent}>
              <View style={styles.doneIconCircle}>
                <Text style={styles.doneEmoji}>🎉</Text>
              </View>
              <Text style={styles.doneTitle}>Vidéo prête !</Text>
              <Text style={styles.doneSubtitle}>
                Ton histoire est prête à être partagée
              </Text>

              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <LinearGradient
                  colors={['#6B4CE6', '#FF6B9D']}
                  style={styles.shareGradient}
                >
                  <Ionicons name="share-social" size={22} color="white" />
                  <Text style={styles.shareText}>Partager</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backToStoryBtn} onPress={() => router.back()}>
                <Ionicons name="book-outline" size={18} color={Colors.secondary} />
                <Text style={styles.backToStoryText}>Retour à l'histoire</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'error' && (
            <View style={styles.doneContent}>
              <Text style={{ fontSize: 56, marginBottom: 16 }}>😔</Text>
              <Text style={styles.doneTitle}>Oups...</Text>
              <Text style={styles.doneSubtitle}>
                Quelque chose n'a pas fonctionné
              </Text>
              <TouchableOpacity style={styles.shareButton} onPress={() => setStep('idle')}>
                <LinearGradient colors={['#FFD93D', '#FF8C42']} style={styles.shareGradient}>
                  <MaterialCommunityIcons name="refresh" size={22} color="#2D1B0E" />
                  <Text style={[styles.shareText, { color: '#2D1B0E' }]}>Réessayer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  content: { flex: 1, paddingHorizontal: 24 },

  // Idle
  idleContent: { flex: 1, paddingTop: 10 },
  previewCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 22, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  previewGradient: { padding: 24, alignItems: 'center' },
  previewEmoji: { fontSize: 40, marginBottom: 10 },
  previewTitle: { fontSize: 20, fontWeight: '800', color: 'white', textAlign: 'center', marginBottom: 6 },
  previewSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  explainTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  explainText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21, marginBottom: 20 },
  featureList: { gap: 10, marginBottom: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureDot: { width: 10, height: 10, borderRadius: 5 },
  featureText: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.sunYellow + '15', borderRadius: 12,
    padding: 12, marginBottom: 18,
  },
  warningText: { flex: 1, fontSize: 13, color: Colors.warning, lineHeight: 18, fontWeight: '500' },
  exportButton: { borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#FF8C42', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  exportGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  exportText: { fontSize: 18, fontWeight: '800', color: '#2D1B0E' },

  // Processing
  processingContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  processingIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.secondary + '15', justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.secondary + '30', marginBottom: 24,
  },
  processingEmoji: { fontSize: 48 },
  processingTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  processingProgress: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600', marginBottom: 30 },
  processingSteps: { gap: 12, width: '100%', maxWidth: 260 },
  pStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pStepText: { fontSize: 15, color: Colors.text, fontWeight: '500' },

  // Done
  doneContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  doneIconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.success + '15', justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  doneEmoji: { fontSize: 48 },
  doneTitle: { fontSize: 28, fontWeight: '900', color: Colors.text, marginBottom: 8 },
  doneSubtitle: { fontSize: 16, color: Colors.textSecondary, fontWeight: '500', marginBottom: 30 },
  shareButton: { borderRadius: 20, overflow: 'hidden', width: '100%', elevation: 4, shadowColor: '#6B4CE6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, marginBottom: 14 },
  shareGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  shareText: { fontSize: 18, fontWeight: '800', color: 'white' },
  backToStoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  backToStoryText: { fontSize: 16, fontWeight: '700', color: Colors.secondary },
});
