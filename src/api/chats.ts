/**
 * Chat API Functions
 * Endpoints for chat/conversation management
 */

import { api } from './client';
import type {
  Chat,
  Message,
  CreateChatRequest,
  SendMessageRequest,
  SendMessageResponse,
  UpdateChatRequest,
} from '../types/chat';

const CHATS_ENDPOINT = '/chats';

// Response type from backend (uses camelCase for frontend)
interface ChatApiResponse {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    sources?: number;
    images?: string[];
  }>;
  updatedAt: string;
  createdAt: string;
  pinned: boolean;
  isTracking: boolean;
  trackingActive: boolean;
  updateCount: number;
  trackingFrequency?: string;
  notificationEnabled: boolean;
  notificationGranularity: 'update' | 'prompt';
}

// Convert API response to Chat type (convert string dates to Date objects)
function toChat(response: ChatApiResponse): Chat {
  return {
    ...response,
    updatedAt: new Date(response.updatedAt),
    messages: response.messages.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
  };
}

/**
 * Fetch all chats for the current user
 */
export async function getChats(): Promise<Chat[]> {
  const response = await api.get<{ chats: ChatApiResponse[] }>(CHATS_ENDPOINT);
  return response.chats.map(toChat);
}

/**
 * Fetch a single chat with all messages
 */
export async function getChat(chatId: string): Promise<Chat> {
  const response = await api.get<ChatApiResponse>(`${CHATS_ENDPOINT}/${chatId}`);
  return toChat(response);
}

/**
 * Create a new chat
 */
export async function createChat(data: CreateChatRequest & { messages?: Message[] }): Promise<Chat> {
  // Convert Date objects to ISO strings for API
  const apiData = {
    ...data,
    messages: data.messages?.map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    })),
  };
  const response = await api.post<ChatApiResponse>(CHATS_ENDPOINT, apiData);
  return toChat(response);
}

/**
 * Send a message in a chat and receive AI response
 */
export async function sendMessage(
  chatId: string,
  data: SendMessageRequest
): Promise<SendMessageResponse> {
  return api.post<SendMessageResponse>(
    `${CHATS_ENDPOINT}/${chatId}/messages`,
    data
  );
}

/**
 * Update chat properties (title, pin status, tracking settings)
 */
export async function updateChat(
  chatId: string,
  data: UpdateChatRequest & { messages?: Message[] }
): Promise<Chat> {
  // Convert Date objects to ISO strings for API
  const apiData = {
    ...data,
    messages: data.messages?.map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    })),
  };
  const response = await api.put<ChatApiResponse>(
    `${CHATS_ENDPOINT}/${chatId}`,
    apiData
  );
  return toChat(response);
}

/**
 * Pin or unpin a chat
 */
export async function togglePinChat(chatId: string, pinned: boolean): Promise<Chat> {
  return updateChat(chatId, { pinned });
}

/**
 * Delete a chat
 */
export async function deleteChat(chatId: string): Promise<void> {
  await api.delete(`${CHATS_ENDPOINT}/${chatId}`);
}
