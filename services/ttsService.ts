import * as FileSystem from 'expo-file-system/legacy';

const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';

export async function generateChapterAudio(
  text: string,
  chapterIndex: number,
  storyId: string,
  apiKey: string,
  voice: 'nova' | 'shimmer' | 'alloy' | 'echo' | 'fable' | 'onyx' = 'nova'
): Promise<string | undefined> {
  try {
    const response = await fetch(OPENAI_TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice,
        response_format: 'mp3',
        speed: 0.9,
      }),
    });

    if (!response.ok) return undefined;

    const dir = `${FileSystem.documentDirectory}edem_audio/`;
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }

    const filePath = `${dir}${storyId}_ch${chapterIndex}.mp3`;

    const blob = await response.blob();
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    await FileSystem.writeAsStringAsync(filePath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return filePath;
  } catch (error) {
    console.error(`TTS generation failed for chapter ${chapterIndex}:`, error);
    return undefined;
  }
}

export async function generateAllChapterAudios(
  chapters: { title: string; text: string }[],
  storyId: string,
  apiKey: string,
  onProgress?: (done: number, total: number) => void
): Promise<(string | undefined)[]> {
  const results: (string | undefined)[] = [];

  for (let i = 0; i < chapters.length; i++) {
    onProgress?.(i, chapters.length);
    const fullText = `${chapters[i].title}.\n\n${chapters[i].text}`;
    const uri = await generateChapterAudio(fullText, i, storyId, apiKey);
    results.push(uri);
  }

  onProgress?.(chapters.length, chapters.length);
  return results;
}
