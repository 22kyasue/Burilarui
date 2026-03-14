export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  sources?: number;
  images?: string[];
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
  createdAt: string;
  pinned: boolean;
}
