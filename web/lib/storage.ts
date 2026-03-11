import { GeneratedStory } from './types';

const STORIES_KEY = 'edem_stories';
const CREDITS_KEY = 'edem_credits';
const FREE_STORIES = 2;

export function saveStory(story: GeneratedStory): void {
  const stories = getStories();
  stories.unshift(story);
  localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
}

export function getStories(): GeneratedStory[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORIES_KEY);
  return data ? JSON.parse(data) : [];
}

export function getStory(id: string): GeneratedStory | null {
  return getStories().find((s) => s.id === id) ?? null;
}

export function deleteStory(id: string): void {
  const stories = getStories().filter((s) => s.id !== id);
  localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
}

export function getStoriesCreated(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(CREDITS_KEY) || '0', 10);
}

export function incrementStoriesCreated(): void {
  localStorage.setItem(CREDITS_KEY, String(getStoriesCreated() + 1));
}

export function getFreeStoriesLeft(): number {
  return Math.max(0, FREE_STORIES - getStoriesCreated());
}

export function canUseAI(): boolean {
  return getStoriesCreated() < FREE_STORIES;
}
