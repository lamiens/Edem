import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = width * 0.65;

export default function PhotoScreen() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });
      if (result?.uri) {
        setPhoto(result.uri);
        setShowCamera(false);
      }
    } catch (e) {
      Alert.alert('Oops !', 'Impossible de prendre la photo. Réessaie !');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Permission requise',
          'Edem a besoin de ta caméra pour te prendre en photo !'
        );
        return;
      }
    }
    setShowCamera(true);
  };

  const handleContinue = () => {
    animatePress();
    router.push({
      pathname: '/create/region',
      params: { photoUri: photo || '' },
    });
  };

  const handleSkip = () => {
    router.push({
      pathname: '/create/region',
      params: { photoUri: '' },
    });
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          <SafeAreaView style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={() => setShowCamera(false)}
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Prends-toi en photo !</Text>
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}
              >
                <Ionicons name="camera-reverse-outline" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraGuide}>
              <View style={styles.cameraFrame} />
            </View>

            <View style={styles.cameraBottomBar}>
              <TouchableOpacity style={styles.shutterButton} onPress={takePhoto}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#6B4CE6', '#FF6B9D']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.stepText}>Étape 1/3</Text>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>C'est toi le héros ! 📸</Text>
          <Text style={styles.subtitle}>
            Prends-toi en photo pour apparaître{'\n'}dans ton histoire
          </Text>

          {/* Photo area */}
          <Animated.View style={[styles.photoArea, { transform: [{ scale: bounceAnim }] }]}>
            {photo ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photo }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => setPhoto(null)}
                >
                  <Ionicons name="close-circle" size={32} color={Colors.accent} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons
                  name="account-circle-outline"
                  size={80}
                  color="rgba(255,255,255,0.4)"
                />
                <Text style={styles.placeholderText}>Ta photo ici</Text>
              </View>
            )}
          </Animated.View>

          {/* Photo buttons */}
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoOption} onPress={openCamera}>
              <LinearGradient
                colors={['#FFD93D', '#FF8C42']}
                style={styles.photoOptionGradient}
              >
                <Ionicons name="camera" size={28} color="#2D1B0E" />
                <Text style={styles.photoOptionText}>Caméra</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoOption} onPress={pickImage}>
              <LinearGradient
                colors={['#6EC6FF', '#6B4CE6']}
                style={styles.photoOptionGradient}
              >
                <Ionicons name="images" size={28} color="white" />
                <Text style={[styles.photoOptionText, { color: 'white' }]}>Galerie</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Continue button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.continueButton, !photo && styles.continueButtonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueText}>
              {photo ? 'Super ! On continue' : 'Continuer sans photo'}
            </Text>
            <Ionicons name="arrow-forward" size={22} color={photo ? '#2D1B0E' : 'rgba(255,255,255,0.7)'} />
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
    paddingBottom: 10,
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
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  photoArea: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    marginBottom: 30,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: PHOTO_SIZE / 2,
  },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  photoOption: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  photoOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  photoOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D1B0E',
  },
  bottomBar: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD93D',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  continueText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D1B0E',
  },
  // Camera styles
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between' },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  cameraBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  cameraGuide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFrame: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
  },
  cameraBottomBar: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
});
