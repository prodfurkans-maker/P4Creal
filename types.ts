
// Enum representing the available emotional states for selection
export enum Emotion {
  SAD = 'Üzgün',
  ANGRY = 'Öfkeli',
  LONELY = 'Yalnız',
  CONFUSED = 'Kafası Karışık'
}

export interface GeminiResponse {
  empathy: string;
  suggestion: string;
  question: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  data?: GeminiResponse;
}
