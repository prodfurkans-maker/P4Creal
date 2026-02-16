
export enum Emotion {
  SAD = 'Üzgün',
  ANGRY = 'Öfkeli',
  LONELY = 'Yalnız',
  CONFUSED = 'Şaşkın'
}

export interface GeminiResponse {
  storyContent?: string;
  reflection: string;
  question: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  data?: GeminiResponse;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}
