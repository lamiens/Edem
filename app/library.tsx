import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getStories, deleteStory } from '@/services/storageService';
import { GeneratedStory } from '@/types';

const { width } = Dimensions.get('window');

function StoryCard({
  story,
  index,
  onPress,
  onDelete,
}: {
  story: GeneratedStory;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 100,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const date = new Date(story.createdAt);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.storyCard}
        activeOpacity={0.85}
        onPress={onPress}
      >
        <LinearGradient
          colors={[story.coverColor, story.coverColor + 'AA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardRegionBadge}>
              <Text style={styles.cardRegionEmoji}>{story.answers.region?.emoji}</Text>
              <Text style={styles.cardRegionText}>{story.answers.region?.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardContent}>
            {story.answers.photoUri ? (
              <Image
                source={{ uri: story.answers.photoUri }}
                style={styles.cardPhoto}
              />
            ) : (
              <View style={styles.cardPhotoPlaceholder}>
                <MaterialCommunityIcons
                  name="account-circle"
                  size={36}
                  color="rgba(255,255,255,0.5)"
                />
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {story.title}
              </Text>
              <Text style={styles.cardHero}>
                Héros : {story.answers.heroName}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardDate}>{formattedDate}</Text>
            <View style={styles.cardChapters}>
              <Ionicons name="book-outline" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.cardChaptersText}>
                {story.chapters.length} chapitres
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function LibraryScreen() {
  const [stories, setStories] = useState<GeneratedStory[]>([]);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadStories();
    }, [])
  );

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadStories = async () => {
    const data = await getStories();
    setStories(data);
  };

  const handleDelete = (story: GeneratedStory) => {
    Alert.alert(
      'Supprimer ?',
      `Tu veux vraiment supprimer "${story.title}" ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            await deleteStory(story.id);
            loadStories();
          },
        },
      ]
    );
  };

  const openStory = (story: GeneratedStory) => {
    router.push({
      pathname: '/create/story',
      params: { storyId: story.id },
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes histoires</Text>
          <View style={{ width: 44 }} />
        </View>

        <Animated.View style={[styles.content, { opacity: fadeIn }]}>
          {stories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyTitle}>Pas encore d'histoire</Text>
              <Text style={styles.emptySubtitle}>
                Crée ta première histoire magique{'\n'}et retrouve-la ici !
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/create/photo')}
              >
                <LinearGradient
                  colors={['#FFD93D', '#FF8C42']}
                  style={styles.createButtonGradient}
                >
                  <MaterialCommunityIcons name="book-plus" size={24} color="#2D1B0E" />
                  <Text style={styles.createButtonText}>Créer une histoire</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={stories}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <StoryCard
                  story={item}
                  index={index}
                  onPress={() => openStory(item)}
                  onDelete={() => handleDelete(item)}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
              ListHeaderComponent={() => (
                <Text style={styles.listCount}>
                  {stories.length} histoire{stories.length > 1 ? 's' : ''}
                </Text>
              )}
            />
          )}
        </Animated.View>
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
  content: { flex: 1 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  createButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 10,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2D1B0E',
  },
  listContent: {
    padding: 20,
  },
  listCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 14,
  },
  storyCard: {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardRegionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  cardRegionEmoji: { fontSize: 14 },
  cardRegionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  cardPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cardPhotoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    lineHeight: 24,
  },
  cardHero: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  cardChapters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardChaptersText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
});
