import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeneratedStory } from '@/types';

const STORIES_KEY = '@edem_stories';

export async function saveStory(story: GeneratedStory): Promise<void> {
  const existing = await getStories();
  existing.unshift(story);
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(existing));
}

export async function getStories(): Promise<GeneratedStory[]> {
  const data = await AsyncStorage.getItem(STORIES_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export async function deleteStory(id: string): Promise<void> {
  const stories = await getStories();
  const filtered = stories.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(filtered));
}

export async function getStory(id: string): Promise<GeneratedStory | null> {
  const stories = await getStories();
  return stories.find((s) => s.id === id) ?? null;
}
