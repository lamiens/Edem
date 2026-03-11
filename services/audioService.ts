import { AudioModule } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { OPENAI_API_KEY } from '@/constants/Config';
import { Alert } from 'react-native';

let currentChapterIndex = -1;
let isNarrating = false;
let isPaused = false;
let lastText = '';
let lastOnDone: (() => void) | undefined;
let currentAudioUri: string | null = null;
let playbackCallback: (() => void) | null = null;

function cleanText(text: string): string {
  return text
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .replace(/[""«»]/g, '"')
    .replace(/\.\s*\./g, '.')
    .trim();
}

function splitIntoChunks(text: string, maxLen = 180): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length > maxLen && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function downloadGoogleTtsChunk(text: string, index: number, dir: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fr&client=tw-ob&q=${encoded}`;
    const filePath = `${dir}chunk_${Date.now()}_${index}.mp3`;

    const result = await FileSystem.downloadAsync(url, filePath);

    if (result.status === 200) {
      return filePath;
    }
    console.warn('Google TTS chunk failed:', result.status);
    return null;
  } catch (error) {
    console.warn('Google TTS download error:', error);
    return null;
  }
}

async function concatMp3Files(files: string[], outputPath: string): Promise<string> {
  let allBase64 = '';
  for (const file of files) {
    const chunk = await FileSystem.readAsStringAsync(file, {
      encoding: FileSystem.EncodingType.Base64,
    });
    allBase64 += chunk;
  }
  await FileSystem.writeAsStringAsync(outputPath, allBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return outputPath;
}

async function generateFreeTts(text: string): Promise<string | null> {
  try {
    const dir = `${FileSystem.cacheDirectory}edem_tts/`;
    try {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    } catch {}

    const chunks = splitIntoChunks(text, 180);
    const files: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const file = await downloadGoogleTtsChunk(chunks[i], i, dir);
      if (file) files.push(file);
    }

    if (files.length === 0) return null;

    if (files.length === 1) {
      console.log('Free TTS: 1 chunk generated');
      return files[0];
    }

    const outputPath = `${dir}full_${Date.now()}.mp3`;
    await concatMp3Files(files, outputPath);
    console.log('Free TTS:', files.length, 'chunks combined');
    return outputPath;
  } catch (error) {
    console.warn('Free TTS failed:', error);
    return null;
  }
}

async function generateOpenAiTts(text: string): Promise<string | null> {
  const apiKey = OPENAI_API_KEY;
  if (!apiKey || apiKey === 'VOTRE_CLE_API_ICI') return null;

  try {
    const dir = `${FileSystem.cacheDirectory}edem_tts/`;
    try {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    } catch {}

    const filePath = `${dir}tts_${Date.now()}.mp3`;

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.slice(0, 4096),
        voice: 'nova',
        response_format: 'mp3',
        speed: 0.95,
      }),
    });

    if (!response.ok) {
      console.warn('OpenAI TTS HTTP error:', response.status);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    await FileSystem.writeAsStringAsync(filePath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('OpenAI TTS generated OK');
    return filePath;
  } catch (error) {
    console.warn('OpenAI TTS failed:', error);
    return null;
  }
}

async function generateTtsAudio(text: string): Promise<string | null> {
  // Try OpenAI first (best quality)
  const openaiFile = await generateOpenAiTts(text);
  if (openaiFile) return openaiFile;

  // Fallback: free Google Translate TTS
  const freeFile = await generateFreeTts(text);
  if (freeFile) return freeFile;

  return null;
}

export function getAudioUri(): string | null {
  return currentAudioUri;
}

export function onAudioFinished(): void {
  isNarrating = false;
  isPaused = false;
  currentAudioUri = null;
  const cb = playbackCallback;
  playbackCallback = null;
  cb?.();
}

export async function startNarration(
  text: string,
  chapterIndex: number,
  onDone?: () => void
): Promise<void> {
  stopNarration();

  const cleaned = cleanText(text);
  if (!cleaned) {
    onDone?.();
    return;
  }

  currentChapterIndex = chapterIndex;
  isNarrating = true;
  isPaused = false;
  lastText = cleaned;
  lastOnDone = onDone;

  await AudioModule.setAudioModeAsync({ playsInSilentMode: true });

  const audioFile = await generateTtsAudio(cleaned);
  if (audioFile) {
    currentAudioUri = audioFile;
    playbackCallback = onDone || null;
    return;
  }

  console.warn('All TTS methods failed');
  isNarrating = false;
  onDone?.();
}

export function stopNarration(): void {
  isNarrating = false;
  isPaused = false;
  currentChapterIndex = -1;
  currentAudioUri = null;
  playbackCallback = null;
  lastText = '';
  lastOnDone = undefined;
}

export async function testSpeech(): Promise<string | null> {
  stopNarration();
  isNarrating = true;

  await AudioModule.setAudioModeAsync({ playsInSilentMode: true });

  const testText = 'Bonjour ! Je suis Edem, ton conteur magique !';
  const audioFile = await generateTtsAudio(testText);

  if (!audioFile) {
    isNarrating = false;
    Alert.alert(
      'Son indisponible',
      'Vérifiez votre connexion internet.'
    );
    return null;
  }

  currentAudioUri = audioFile;
  playbackCallback = () => { isNarrating = false; };
  return audioFile;
}

export function getNarrationState() {
  return { isNarrating, currentChapterIndex, isPaused };
}

export function narrateStorySequentially(
  chapters: { title: string; text: string }[],
  onChapterStart?: (index: number) => void,
  onAllDone?: () => void
): void {
  let currentIdx = 0;

  const narrateNext = () => {
    if (currentIdx >= chapters.length) {
      onAllDone?.();
      return;
    }

    onChapterStart?.(currentIdx);
    const chapter = chapters[currentIdx];
    const fullText = `${chapter.title}. ${chapter.text}`;

    startNarration(fullText, currentIdx, () => {
      currentIdx++;
      setTimeout(narrateNext, 800);
    });
  };

  narrateNext();
}
