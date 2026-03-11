import * as FileSystem from 'expo-file-system/legacy';
import { OPENAI_API_KEY } from '@/constants/Config';
import { StoryAnswers } from '@/types';

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

async function analyzePhotoWithVision(photoUri: string): Promise<string | null> {
  const apiKey = OPENAI_API_KEY;
  if (!apiKey || apiKey === 'VOTRE_CLE_API_ICI') return null;

  try {
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this child briefly for an illustrator (1-2 sentences): hair, skin tone, face shape, features. English only.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
                detail: 'low',
              },
            },
          ],
        }],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.warn('Vision API error:', response.status);
      return null;
    }

    const data = await response.json();
    const desc = data.choices?.[0]?.message?.content;
    if (desc) console.log('Photo analysis:', desc);
    return desc || null;
  } catch (error) {
    console.warn('Photo analysis failed:', error);
    return null;
  }
}

function buildDefaultDescription(answers: StoryAnswers): string {
  const traits: Record<string, string> = {
    'caribbean': 'curly hair, warm brown skin, joyful eyes',
    'west-africa': 'short natural hair, deep brown skin, radiant smile',
    'central-africa': 'coily hair, rich dark skin, expressive eyes',
    'east-africa': 'short hair, warm brown skin, high cheekbones',
    'usa': 'stylish afro, medium brown skin, confident look',
    'europe': 'curly hair, warm brown skin, curious eyes',
    'indian-ocean': 'wavy dark hair, golden brown skin, gentle smile',
    'brazil': 'curly dark hair, caramel skin, energetic expression',
  };
  const t = traits[answers.region?.id] || 'natural hair, dark brown skin, warm smile';
  return `young Black child ${answers.heroName} with ${t}`;
}

export async function createCartoonAvatar(
  photoUri: string | undefined,
  answers: StoryAnswers,
  storyId: string
): Promise<{ avatarUri: string | undefined; description: string }> {
  let description = buildDefaultDescription(answers);

  if (photoUri) {
    const aiDesc = await analyzePhotoWithVision(photoUri);
    if (aiDesc) description = aiDesc;
  }

  const dir = `${FileSystem.documentDirectory}edem_avatars/`;
  await ensureDir(dir);
  const localPath = `${dir}${storyId}_avatar.jpg`;

  const shortPrompt = `cartoon character portrait, Disney Pixar style, ${description.slice(0, 150)}, head shoulders, big eyes, warm smile, sparkles, soft background, no text`;

  // Try DALL-E
  const apiKey = OPENAI_API_KEY;
  if (apiKey && apiKey !== 'VOTRE_CLE_API_ICI') {
    try {
      const dallePrompt = `Character portrait, cartoon Disney Pixar style. ${description}. Head and shoulders, front view, big bright eyes, warm smile, magical sparkles. Soft gradient background. No text. Safe for children.`;
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: dallePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid',
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const imageUrl = data?.data?.[0]?.url;
        if (imageUrl) {
          const dl = await FileSystem.downloadAsync(imageUrl, localPath);
          if (dl.status === 200) {
            console.log('DALL-E avatar: OK');
            return { avatarUri: dl.uri, description };
          }
        }
      } else {
        console.warn('DALL-E avatar error:', resp.status);
      }
    } catch (error) {
      console.warn('DALL-E avatar failed:', error);
    }
  }

  // Fallback: Pollinations
  try {
    const encoded = encodeURIComponent(shortPrompt);
    const seed = Math.floor(Math.random() * 99999);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${seed}`;

    console.log('Pollinations avatar: requesting... URL length=', url.length);
    const dl = await FileSystem.downloadAsync(url, localPath);
    console.log('Pollinations avatar: status=', dl.status);

    if (dl.status === 200) {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists && (info as any).size > 1000) {
        console.log('Pollinations avatar: OK');
        return { avatarUri: dl.uri, description };
      }
    }
  } catch (error) {
    console.warn('Pollinations avatar failed:', error);
  }

  // Fetch fallback
  try {
    const encoded = encodeURIComponent(shortPrompt);
    const seed = Math.floor(Math.random() * 99999);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${seed}`;

    console.log('Pollinations avatar fetch fallback...');
    const resp = await fetch(url);
    if (resp.ok) {
      const blob = await resp.blob();
      if (blob.size > 1000) {
        const reader = new FileReader();
        const b64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        await FileSystem.writeAsStringAsync(localPath, b64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log('Pollinations avatar fetch fallback: OK');
        return { avatarUri: localPath, description };
      }
    }
  } catch (error) {
    console.warn('Pollinations avatar fetch fallback failed:', error);
  }

  console.warn('Avatar: all methods failed');
  return { avatarUri: undefined, description };
}
