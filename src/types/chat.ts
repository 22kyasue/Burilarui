/**
 * Chat & Message Type Definitions
 * Shared interfaces for chat-related data
 */

// Message in a chat conversation
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: number;
  images?: string[];
  attachments?: {
    id: string;
    name: string;
    type: string;
    url?: string;
    size?: number;
  }[];
}

// Chat/Conversation with optional tracking features
export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
  pinned?: boolean;
  isTracking?: boolean;
  trackingActive?: boolean;
  updateCount?: number;
  trackingFrequency?: string;
  notificationEnabled?: boolean;
  notificationGranularity?: 'update' | 'prompt';
  thumbnail?: string;
  updates?: any[];
}

// Request to create a new chat
export interface CreateChatRequest {
  title?: string;
  initialMessage?: string;
  isTracking?: boolean;
  trackingFrequency?: string;
  notificationEnabled?: boolean;
  notificationGranularity?: 'update' | 'prompt';
}

// Response when creating a chat
export interface CreateChatResponse {
  chat: Chat;
}

// Request to send a message
export interface SendMessageRequest {
  content: string;
}

// Response when sending a message (includes AI response)
export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
}

// Request to update chat (pin, title, etc.)
export interface UpdateChatRequest {
  title?: string;
  pinned?: boolean;
  trackingActive?: boolean;
  trackingFrequency?: string;
  notificationEnabled?: boolean;
  notificationGranularity?: 'update' | 'prompt';
  isTracking?: boolean;
  thumbnail?: string;
}

// Chat list item (lighter version for lists)
export interface ChatListItem {
  id: string;
  title: string;
  updatedAt: Date;
  pinned?: boolean;
  isTracking?: boolean;
  trackingActive?: boolean;
  updateCount?: number;
  lastMessage?: string;
}

// Response for chat list
export interface ChatListResponse {
  chats: ChatListItem[];
}

// Response for single chat with full messages
export interface ChatDetailResponse {
  chat: Chat;
}
