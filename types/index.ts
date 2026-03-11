export interface Region {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

export interface StoryQuestion {
  id: string;
  question: string;
  subtitle?: string;
  choices: StoryChoice[];
  type: 'single' | 'text';
}

export interface StoryChoice {
  id: string;
  label: string;
  emoji: string;
  value: string;
}

export interface StoryAnswers {
  heroName: string;
  region: Region;
  heroTrait: string;
  setting: string;
  companion: string;
  challenge: string;
  power: string;
  moral: string;
  photoUri?: string;
}

export interface GeneratedStory {
  id: string;
  title: string;
  chapters: StoryChapter[];
  answers: StoryAnswers;
  createdAt: string;
  coverColor: string;
  avatarUri?: string;
  characterDescription?: string;
}

export interface StoryChapter {
  title: string;
  text: string;
  illustration: string;
  imageUri?: string;
}

export type NarrationState = 'idle' | 'playing' | 'paused';
