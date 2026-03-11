import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { regions } from '@/constants/Regions';
import { Region } from '@/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 76) / 2;

function RegionCard({
  region,
  index,
  selected,
  onPress,
}: {
  region: Region;
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 80,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.regionCard,
          selected && { borderColor: region.color, borderWidth: 3 },
        ]}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <View style={[styles.regionEmojiCircle, { backgroundColor: region.color + '20' }]}>
          <Text style={styles.regionEmoji}>{region.emoji}</Text>
        </View>
        <Text style={styles.regionName}>{region.name}</Text>
        <Text style={styles.regionDesc} numberOfLines={2}>{region.description}</Text>
        {selected && (
          <View style={[styles.selectedBadge, { backgroundColor: region.color }]}>
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RegionScreen() {
  const params = useLocalSearchParams<{ photoUri: string }>();
  const [selectedRegion, setSelectedRegion] = React.useState<Region | null>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = () => {
    if (!selectedRegion) return;
    router.push({
      pathname: '/create/questions',
      params: {
        photoUri: params.photoUri || '',
        regionId: selectedRegion.id,
      },
    });
  };

  return (
    <LinearGradient
      colors={['#FF8C42', '#FFD93D']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.stepText}>Étape 2/3</Text>
          <View style={{ width: 44 }} />
        </View>

        <Animated.View style={[styles.titleSection, { opacity: fadeIn }]}>
          <Text style={styles.title}>D'où vient ton héros ? 🌍</Text>
          <Text style={styles.subtitle}>Choisis une région du monde</Text>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {regions.map((region, index) => (
            <RegionCard
              key={region.id}
              region={region}
              index={index}
              selected={selectedRegion?.id === region.id}
              onPress={() => setSelectedRegion(region)}
            />
          ))}
        </ScrollView>

        {/* Continue */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.continueButton, !selectedRegion && styles.continueDisabled]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={!selectedRegion}
          >
            <Text style={[styles.continueText, !selectedRegion && { color: 'rgba(255,255,255,0.5)' }]}>
              {selectedRegion ? `${selectedRegion.emoji} C'est parti !` : 'Choisis une région'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={22}
              color={selectedRegion ? '#2D1B0E' : 'rgba(255,255,255,0.5)'}
            />
          </TouchableOpacity>
        </View>
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
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  titleSection: {
    paddingHorizontal: 30,
    paddingBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 6,
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 22,
    gap: 12,
    paddingBottom: 20,
  },
  regionCard: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  regionEmojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  regionEmoji: {
    fontSize: 26,
  },
  regionName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1B0E',
    textAlign: 'center',
    marginBottom: 4,
  },
  regionDesc: {
    fontSize: 11,
    color: '#8B6F47',
    textAlign: 'center',
    lineHeight: 15,
  },
  selectedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  bottomBar: {
    paddingHorizontal: 30,
    paddingBottom: 20,
    paddingTop: 10,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  continueDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    elevation: 0,
    shadowOpacity: 0,
  },
  continueText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D1B0E',
  },
});
