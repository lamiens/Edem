import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  Share,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Colors } from '@/constants/Colors';
import { getStory } from '@/services/storageService';
import { startNarration, stopNarration, narrateStorySequentially, testSpeech, getAudioUri, onAudioFinished } from '@/services/audioService';
import { GeneratedStory, StoryChapter, NarrationState } from '@/types';

const { width, height } = Dimensions.get('window');
const PAGE_WIDTH = width;

const PANEL_GRADIENTS: [string, string][] = [
  ['#FF8C42', '#FFD93D'],
  ['#6B4CE6', '#6EC6FF'],
  ['#10B981', '#4ADE80'],
  ['#FF6B9D', '#FF8C42'],
];

const PANEL_EMOJIS = ['🌅', '🌟', '⚔️', '🎉'];

const PLACEHOLDER_PATTERNS = [
  { bg: '#FFF3E0', border: '#FF8C42', icon: '🌅' },
  { bg: '#EDE7F6', border: '#6B4CE6', icon: '✨' },
  { bg: '#E8F5E9', border: '#10B981', icon: '🌿' },
  { bg: '#FCE4EC', border: '#FF6B9D', icon: '🎆' },
];

function ComicPanel({
  chapter,
  index,
  photoUri,
  avatarUri,
  heroName,
  isActive,
}: {
  chapter: StoryChapter;
  index: number;
  photoUri?: string;
  avatarUri?: string;
  heroName: string;
  isActive: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const gradient = PANEL_GRADIENTS[index % PANEL_GRADIENTS.length];
  const placeholder = PLACEHOLDER_PATTERNS[index % PLACEHOLDER_PATTERNS.length];
  const paragraphs = chapter.text.split('\n\n').filter(Boolean);

  useEffect(() => {
    if (isActive) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive]);

  return (
    <Animated.ScrollView
      style={[styles.pageContainer, { opacity: fadeAnim }]}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Chapter title banner */}
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.chapterBanner}
      >
        <Text style={styles.chapterNumber}>Chapitre {index + 1}</Text>
        <Text style={styles.chapterTitle}>{chapter.title}</Text>
      </LinearGradient>

      {/* Main illustration panel */}
      <View style={styles.illustrationPanel}>
        {chapter.imageUri ? (
          <Image
            source={{ uri: chapter.imageUri }}
            style={styles.illustrationImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderIllustration, { backgroundColor: placeholder.bg, borderColor: placeholder.border }]}>
            <Text style={styles.placeholderIcon}>{placeholder.icon}</Text>
            <Text style={[styles.placeholderDesc, { color: placeholder.border }]}>
              {chapter.illustration}
            </Text>
          </View>
        )}

        {/* Comic-style caption overlay */}
        <View style={styles.captionOverlay}>
          <View style={[styles.captionBubble, { backgroundColor: gradient[0] }]}>
            <Text style={styles.captionText}>Chapitre {index + 1}</Text>
          </View>
        </View>
      </View>

      {/* Hero avatar badge on first chapter */}
      {index === 0 && (avatarUri || photoUri) ? (
        <View style={styles.heroBadge}>
          {avatarUri ? (
            <View style={styles.avatarCompare}>
              <Image source={{ uri: avatarUri }} style={styles.heroBadgeAvatar} />
              {photoUri ? (
                <View style={styles.miniPhotoOverlay}>
                  <Image source={{ uri: photoUri }} style={styles.miniPhoto} />
                </View>
              ) : null}
            </View>
          ) : photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.heroBadgePhoto} />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.heroBadgeName}>{heroName}</Text>
            <Text style={styles.heroBadgeRole}>
              {avatarUri ? 'Version cartoon du héros' : 'Le héros de cette histoire'}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Story text as comic panels */}
      {paragraphs.map((paragraph, pIdx) => (
        <View
          key={pIdx}
          style={[
            styles.textPanel,
            pIdx % 2 === 0 ? styles.textPanelLeft : styles.textPanelRight,
          ]}
        >
          <View style={[styles.textPanelInner, { borderLeftColor: gradient[0] }]}>
            {pIdx === 0 && (
              <Text style={[styles.dropCap, { color: gradient[0] }]}>
                {paragraph.charAt(0)}
              </Text>
            )}
            <Text style={styles.storyText}>
              {pIdx === 0 ? paragraph.slice(1) : paragraph}
            </Text>
          </View>
        </View>
      ))}

      {/* Bottom illustration description (mini panel) */}
      <View style={styles.miniPanelRow}>
        <View style={[styles.miniPanel, { backgroundColor: gradient[0] + '15', borderColor: gradient[0] + '40' }]}>
          <MaterialCommunityIcons name="palette" size={16} color={gradient[0]} />
          <Text style={[styles.miniPanelText, { color: gradient[0] }]}>
            {chapter.illustration}
          </Text>
        </View>
      </View>

      {/* Page number */}
      <View style={styles.pageNumber}>
        <Text style={styles.pageNumberText}>{index + 1}</Text>
      </View>
    </Animated.ScrollView>
  );
}

export default function StoryScreen() {
  const params = useLocalSearchParams<{ storyId: string }>();
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [narrationState, setNarrationState] = useState<NarrationState>('idle');
  const [narratingChapter, setNarratingChapter] = useState(-1);
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const player = useAudioPlayer(audioSource ?? undefined);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (status.playing === false && audioSource && status.currentTime > 0) {
      setAudioSource(null);
      onAudioFinished();
    }
  }, [status.playing, status.currentTime, audioSource]);

  useEffect(() => {
    if (audioSource && player) {
      player.play();
    }
  }, [audioSource]);

  useEffect(() => {
    loadStory();
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    return () => {
      stopNarration();
      setAudioSource(null);
    };
  }, []);

  const loadStory = async () => {
    if (params.storyId) {
      const s = await getStory(params.storyId);
      setStory(s);
    }
  };

  const totalPages = story ? story.chapters.length + 2 : 0;

  const handleShare = async () => {
    if (!story) return;
    try {
      await Share.share({
        message: `📖 "${story.title}" - Une histoire créée avec Edem !\n\nDécouvre l'appli Edem pour créer tes propres histoires magiques avec des héros qui te ressemblent !`,
      });
    } catch {}
  };

  const goToPage = (page: number) => {
    flatListRef.current?.scrollToIndex({ index: page, animated: true });
    setCurrentPage(page);
  };

  const handlePlayChapter = async (chapterIdx: number) => {
    if (!story) return;
    const chapter = story.chapters[chapterIdx];
    setNarrationState('playing');
    setNarratingChapter(chapterIdx);
    await startNarration(`${chapter.title}. ${chapter.text}`, chapterIdx, () => {
      setNarrationState('idle');
      setNarratingChapter(-1);
    });
    const uri = getAudioUri();
    if (uri) setAudioSource(uri);
  };

  const handlePlayAll = () => {
    if (!story) return;
    setNarrationState('playing');
    narrateStorySequentially(
      story.chapters,
      (idx) => {
        setNarratingChapter(idx);
        goToPage(idx + 1);
        const uri = getAudioUri();
        if (uri) setAudioSource(uri);
      },
      () => {
        setNarrationState('idle');
        setNarratingChapter(-1);
        setAudioSource(null);
      }
    );
  };

  const handlePause = () => {
    if (player) player.pause();
    setNarrationState('paused');
  };

  const handleResume = () => {
    if (player) player.play();
    setNarrationState('playing');
  };

  const handleStop = () => {
    if (player) player.pause();
    stopNarration();
    setAudioSource(null);
    setNarrationState('idle');
    setNarratingChapter(-1);
  };

  const handleTestSound = async () => {
    const uri = await testSpeech();
    if (uri) setAudioSource(uri);
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        setCurrentPage(viewableItems[0].index ?? 0);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  if (!story) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>📖</Text>
        <Text style={styles.loadingText}>Ouverture du livre...</Text>
      </View>
    );
  }

  const pages = [
    { type: 'cover' as const, key: 'cover' },
    ...story.chapters.map((ch, i) => ({ type: 'chapter' as const, key: `ch_${i}`, chapter: ch, index: i })),
    { type: 'end' as const, key: 'end' },
  ];

  const renderPage = ({ item, index }: { item: any; index: number }) => {
    if (item.type === 'cover') {
      return (
        <View style={[styles.pageContainer, styles.coverPage]}>
          <LinearGradient
            colors={[story.coverColor, story.coverColor + 'BB', '#2D1B0E']}
            style={styles.coverGradient}
          >
            {/* Book decoration */}
            <View style={styles.bookDecoration}>
              <View style={styles.bookLine} />
              <View style={styles.bookLine} />
            </View>

            <View style={styles.coverContent}>
              <Text style={styles.coverBookLabel}>Un livre Edem</Text>

              {story.avatarUri ? (
                <View style={styles.coverAvatarContainer}>
                  <View style={styles.coverPhotoFrame}>
                    <Image source={{ uri: story.avatarUri }} style={styles.coverPhoto} />
                  </View>
                  {story.answers.photoUri ? (
                    <View style={styles.coverMiniPhotoFrame}>
                      <Image source={{ uri: story.answers.photoUri }} style={styles.coverMiniPhoto} />
                    </View>
                  ) : null}
                </View>
              ) : story.answers.photoUri ? (
                <View style={[styles.coverPhotoFrame, { marginBottom: 24 }]}>
                  <Image source={{ uri: story.answers.photoUri }} style={styles.coverPhoto} />
                </View>
              ) : (
                <View style={styles.coverEmojiFrame}>
                  <Text style={styles.coverEmoji}>📖</Text>
                </View>
              )}

              <Text style={styles.coverTitle}>{story.title}</Text>

              <View style={styles.coverMetaRow}>
                <Text style={styles.coverRegion}>
                  {story.answers.region?.emoji} {story.answers.region?.name}
                </Text>
              </View>

              <Text style={styles.coverHeroText}>
                Avec {story.answers.heroName} comme héros
              </Text>

              {/* Play all button */}
              <TouchableOpacity style={styles.playAllButton} onPress={handlePlayAll}>
                <LinearGradient
                  colors={['#FFD93D', '#FF8C42']}
                  style={styles.playAllGradient}
                >
                  <FontAwesome5 name="headphones-alt" size={18} color="#2D1B0E" />
                  <Text style={styles.playAllText}>Écouter l'histoire</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.testSoundBtn}
                onPress={handleTestSound}
              >
                <FontAwesome5 name="volume-up" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.testSoundText}>Tester le son</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.coverSwipe}>Glisse pour lire →</Text>
          </LinearGradient>
        </View>
      );
    }

    if (item.type === 'end') {
      return (
        <View style={[styles.pageContainer, styles.endPage]}>
          <View style={styles.endContent}>
            <Text style={styles.endEmoji}>🌟</Text>
            <Text style={styles.endTitle}>Fin</Text>
            <Text style={styles.endMoral}>« {story.answers.moral} »</Text>

            <View style={styles.endButtons}>
              <TouchableOpacity
                style={styles.newStoryBtn}
                onPress={() => router.replace('/create/photo')}
              >
                <LinearGradient colors={['#FFD93D', '#FF8C42']} style={styles.newStoryGradient}>
                  <MaterialCommunityIcons name="book-plus" size={24} color="#2D1B0E" />
                  <Text style={styles.newStoryText}>Nouvelle histoire</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')}>
                <Ionicons name="home-outline" size={20} color={Colors.secondary} />
                <Text style={styles.homeBtnText}>Accueil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    // Chapter page
    return (
      <ComicPanel
        chapter={item.chapter}
        index={item.index}
        photoUri={story.answers.photoUri}
        avatarUri={story.avatarUri}
        heroName={story.answers.heroName}
        isActive={currentPage === index}
      />
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top bar */}
        <Animated.View style={[styles.topBar, { opacity: headerAnim }]}>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.replace('/')}>
            <Ionicons name="home" size={20} color={Colors.text} />
          </TouchableOpacity>

          {/* Page indicator */}
          <View style={styles.pageIndicator}>
            {pages.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.pageDot,
                  i === currentPage && styles.pageDotActive,
                  i === currentPage && { backgroundColor: story.coverColor },
                ]}
              />
            ))}
          </View>

          <View style={styles.topBtnRow}>
            <TouchableOpacity
              style={[styles.topBtn, styles.topBtnExport]}
              onPress={() => router.push({ pathname: '/create/export', params: { storyId: story.id } })}
            >
              <FontAwesome5 name="film" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Pages */}
        <FlatList
          ref={flatListRef}
          data={pages}
          renderItem={renderPage}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: PAGE_WIDTH,
            offset: PAGE_WIDTH * index,
            index,
          })}
        />

        {/* Audio control bar */}
        <View style={styles.audioBar}>
          {narrationState === 'idle' ? (
            <>
              {currentPage > 0 && currentPage <= story.chapters.length ? (
                <TouchableOpacity
                  style={styles.audioBtn}
                  onPress={() => handlePlayChapter(currentPage - 1)}
                >
                  <FontAwesome5 name="play" size={14} color="white" />
                  <Text style={styles.audioBtnText}>Lire ce chapitre</Text>
                </TouchableOpacity>
              ) : currentPage === 0 ? (
                <TouchableOpacity style={styles.audioBtn} onPress={handlePlayAll}>
                  <FontAwesome5 name="headphones-alt" size={14} color="white" />
                  <Text style={styles.audioBtnText}>Écouter tout</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <View style={styles.audioControls}>
              <View style={styles.narratingInfo}>
                <View style={styles.narratingDot} />
                <Text style={styles.narratingText}>
                  {narratingChapter >= 0
                    ? `Chapitre ${narratingChapter + 1}`
                    : 'Narration...'}
                </Text>
              </View>
              <View style={styles.audioActionsRow}>
                {narrationState === 'playing' ? (
                  <TouchableOpacity style={styles.audioControlBtn} onPress={handlePause}>
                    <FontAwesome5 name="pause" size={14} color="white" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.audioControlBtn} onPress={handleResume}>
                    <FontAwesome5 name="play" size={14} color="white" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.audioStopBtn} onPress={handleStop}>
                  <FontAwesome5 name="stop" size={14} color={Colors.accent} />
                </TouchableOpacity>
              </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingEmoji: { fontSize: 48, marginBottom: 12 },
  loadingText: { fontSize: 18, color: Colors.textSecondary, fontWeight: '600' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  topBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  topBtnExport: {
    backgroundColor: Colors.secondary,
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted + '40',
  },
  pageDotActive: {
    width: 20,
    borderRadius: 4,
  },

  // Pages
  pageContainer: {
    width: PAGE_WIDTH,
  },
  pageContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // Cover page
  coverPage: {},
  coverGradient: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 30,
    borderRadius: 0,
  },
  bookDecoration: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    width: 4,
    justifyContent: 'space-evenly',
  },
  bookLine: {
    width: 4,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 2,
  },
  coverContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  coverBookLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  coverAvatarContainer: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
  },
  coverPhotoFrame: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  coverPhoto: { width: '100%', height: '100%' },
  coverMiniPhotoFrame: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
    elevation: 8,
  },
  coverMiniPhoto: { width: '100%', height: '100%' },
  coverEmojiFrame: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  coverEmoji: { fontSize: 48 },
  coverTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 14,
  },
  coverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  coverRegion: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  coverHeroText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    marginBottom: 28,
  },
  playAllButton: {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  playAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 10,
  },
  playAllText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D1B0E',
  },
  testSoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  testSoundText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  coverSwipe: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },

  // Chapter pages
  chapterBanner: {
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  chapterNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
  },

  // Illustration panel (comic style)
  illustrationPanel: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: '#2D1B0E',
    position: 'relative',
    height: 220,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  placeholderIllustration: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    padding: 20,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  placeholderDesc: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  captionOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  captionBubble: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  captionText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'white',
  },

  // Hero badge
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    gap: 12,
    borderWidth: 2,
    borderColor: Colors.sunYellow + '40',
  },
  avatarCompare: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  heroBadgeAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.sunYellow,
  },
  heroBadgePhoto: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  miniPhotoOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
    elevation: 3,
  },
  miniPhoto: {
    width: '100%',
    height: '100%',
  },
  heroBadgeName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  heroBadgeRole: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // Text panels (comic/BD style)
  textPanel: {
    marginBottom: 10,
  },
  textPanelLeft: {
    paddingRight: 6,
  },
  textPanelRight: {
    paddingLeft: 6,
  },
  textPanelInner: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  dropCap: {
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 40,
  },
  storyText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
    letterSpacing: 0.2,
  },

  // Mini panel
  miniPanelRow: {
    marginTop: 6,
    marginBottom: 10,
  },
  miniPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
  },
  miniPanelText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
    fontWeight: '500',
  },

  // Page number
  pageNumber: {
    alignItems: 'center',
    marginTop: 8,
  },
  pageNumberText: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.text,
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
  },

  // End page
  endPage: {
    justifyContent: 'center',
  },
  endContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  endEmoji: { fontSize: 56, marginBottom: 12 },
  endTitle: { fontSize: 36, fontWeight: '900', color: Colors.text, marginBottom: 14 },
  endMoral: {
    fontSize: 18,
    color: Colors.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 36,
    fontWeight: '600',
  },
  endButtons: { width: '100%', gap: 12 },
  newStoryBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  newStoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  newStoryText: { fontSize: 17, fontWeight: '800', color: '#2D1B0E' },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.secondary + '30',
    gap: 8,
  },
  homeBtnText: { fontSize: 16, fontWeight: '700', color: Colors.secondary },

  // Audio bar
  audioBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.shadow,
    backgroundColor: Colors.surface,
    minHeight: 56,
    justifyContent: 'center',
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  audioBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  narratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  narratingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  narratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  audioActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  audioControlBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioStopBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
