import * as FileSystem from 'expo-file-system/legacy';
import { StoryAnswers } from '@/types';

const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

const REGION_CONTEXT: Record<string, string> = {
  'caribbean': 'tropical Caribbean, turquoise sea',
  'west-africa': 'West African village, baobab trees',
  'central-africa': 'African rainforest, exotic flowers',
  'east-africa': 'African savanna, acacia trees',
  'usa': 'American urban setting',
  'europe': 'European cityscape',
  'indian-ocean': 'tropical island, lagoon',
  'brazil': 'colorful Brazilian setting',
};

function buildDallePrompt(
  illustrationDesc: string,
  answers: StoryAnswers,
  characterDescription?: string
): string {
  const artStyle = 'children book illustration, colorful cartoon, vibrant, warm, Disney Pixar African art';
  const charDesc = characterDescription
    ? `${characterDescription}. Name: ${answers.heroName}`
    : `young Black child ${answers.heroName} with dark brown skin, bright eyes`;
  const region = REGION_CONTEXT[answers.region?.id] || 'magical setting';

  return `${artStyle}. Scene: ${illustrationDesc}. Main character: ${charDesc}. Setting: ${region}. No text. Safe for children.`;
}

function buildPollinationsPrompt(
  illustrationDesc: string,
  answers: StoryAnswers,
  characterDescription?: string
): string {
  const charDesc = characterDescription
    ? characterDescription.slice(0, 120)
    : `young Black child ${answers.heroName} dark brown skin`;
  const region = REGION_CONTEXT[answers.region?.id] || 'magical setting';
  const scene = illustrationDesc.slice(0, 100);

  return `children book cartoon illustration, ${scene}, character: ${charDesc}, ${region}, vibrant colors, no text`;
}

async function ensureDir(dir: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  } catch {
    try { await FileSystem.makeDirectoryAsync(dir, { intermediates: true }); } catch {}
  }
}

async function generateDalleIllustration(
  prompt: string,
  storyId: string,
  chapterIndex: number,
  apiKey: string
): Promise<string | undefined> {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid',
      }),
    });

    if (!response.ok) {
      console.warn(`DALL-E ch${chapterIndex + 1} error:`, response.status);
      return undefined;
    }

    const data = await response.json();
    const imageUrl = data?.data?.[0]?.url;
    if (!imageUrl) return undefined;

    const dir = `${FileSystem.documentDirectory}edem_images/`;
    await ensureDir(dir);
    const localPath = `${dir}${storyId}_ch${chapterIndex}.png`;
    const dl = await FileSystem.downloadAsync(imageUrl, localPath);
    console.log(`DALL-E ch${chapterIndex + 1}: OK`);
    return dl.uri;
  } catch (error) {
    console.warn(`DALL-E ch${chapterIndex + 1} failed:`, error);
    return undefined;
  }
}

async function generatePollinationsIllustration(
  shortPrompt: string,
  storyId: string,
  chapterIndex: number
): Promise<string | undefined> {
  const dir = `${FileSystem.documentDirectory}edem_images/`;
  await ensureDir(dir);
  const localPath = `${dir}${storyId}_ch${chapterIndex}_free.jpg`;

  const encoded = encodeURIComponent(shortPrompt);
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=768&height=768&nologo=true&seed=${seed}`;

  console.log(`Pollinations ch${chapterIndex + 1}: URL length=${url.length}, requesting...`);

  try {
    const dl = await FileSystem.downloadAsync(url, localPath);
    console.log(`Pollinations ch${chapterIndex + 1}: status=${dl.status}`);

    if (dl.status === 200) {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists && (info as any).size > 1000) {
        console.log(`Pollinations ch${chapterIndex + 1}: OK (${Math.round(((info as any).size || 0) / 1024)} KB)`);
        return dl.uri;
      }
      console.warn(`Pollinations ch${chapterIndex + 1}: file too small or missing`);
    }
  } catch (error) {
    console.warn(`Pollinations ch${chapterIndex + 1} downloadAsync failed:`, error);
  }

  // Fallback: fetch + write
  try {
    console.log(`Pollinations ch${chapterIndex + 1}: trying fetch fallback...`);
    const resp = await fetch(url);
    if (!resp.ok) {
      console.warn(`Pollinations ch${chapterIndex + 1} fetch error:`, resp.status);
      return undefined;
    }

    const blob = await resp.blob();
    if (blob.size < 1000) {
      console.warn(`Pollinations ch${chapterIndex + 1}: blob too small (${blob.size})`);
      return undefined;
    }

    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        const b64 = result.split(',')[1];
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    await FileSystem.writeAsStringAsync(localPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log(`Pollinations ch${chapterIndex + 1}: fetch fallback OK`);
    return localPath;
  } catch (error) {
    console.warn(`Pollinations ch${chapterIndex + 1} fetch fallback failed:`, error);
    return undefined;
  }
}

export async function generateIllustration(
  illustrationDesc: string,
  answers: StoryAnswers,
  chapterIndex: number,
  storyId: string,
  apiKey?: string,
  characterDescription?: string
): Promise<string | undefined> {
  if (apiKey && apiKey !== 'VOTRE_CLE_API_ICI') {
    const dallePrompt = buildDallePrompt(illustrationDesc, answers, characterDescription);
    const dalleResult = await generateDalleIllustration(dallePrompt, storyId, chapterIndex, apiKey);
    if (dalleResult) return dalleResult;
    console.log(`Ch${chapterIndex + 1}: DALL-E failed, trying Pollinations...`);
  }

  const shortPrompt = buildPollinationsPrompt(illustrationDesc, answers, characterDescription);
  return generatePollinationsIllustration(shortPrompt, storyId, chapterIndex);
}

export async function generateAllIllustrations(
  chapters: { illustration: string }[],
  answers: StoryAnswers,
  storyId: string,
  apiKey?: string,
  onProgress?: (done: number, total: number) => void,
  characterDescription?: string
): Promise<(string | undefined)[]> {
  const results: (string | undefined)[] = [];

  for (let i = 0; i < chapters.length; i++) {
    onProgress?.(i, chapters.length);
    const uri = await generateIllustration(
      chapters[i].illustration,
      answers,
      i,
      storyId,
      apiKey,
      characterDescription
    );
    results.push(uri);
  }

  onProgress?.(chapters.length, chapters.length);
  return results;
}
