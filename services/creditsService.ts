import AsyncStorage from '@react-native-async-storage/async-storage';

const CREDITS_KEY = '@edem_stories_created';
const FREE_STORIES = 2;

export async function getStoriesCreated(): Promise<number> {
  const val = await AsyncStorage.getItem(CREDITS_KEY);
  return val ? parseInt(val, 10) : 0;
}

export async function incrementStoriesCreated(): Promise<void> {
  const current = await getStoriesCreated();
  await AsyncStorage.setItem(CREDITS_KEY, String(current + 1));
}

export async function getFreeStoriesLeft(): Promise<number> {
  const created = await getStoriesCreated();
  return Math.max(0, FREE_STORIES - created);
}

export async function canUseAI(): Promise<boolean> {
  const created = await getStoriesCreated();
  return created < FREE_STORIES;
}

export function getMaxFreeStories(): number {
  return FREE_STORIES;
}
