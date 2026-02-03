/**
 * Chat API Functions
 * Endpoints for chat/conversation management
 */

import { api } from './client';
import type {
  Chat,
  ChatListItem,
  ChatListResponse,
  ChatDetailResponse,
  CreateChatRequest,
  CreateChatResponse,
  SendMessageRequest,
  SendMessageResponse,
  UpdateChatRequest,
} from '../types/chat';

const CHATS_ENDPOINT = '/chats';

/**
 * Fetch all chats for the current user
 */
export async function getChats(): Promise<ChatListItem[]> {
  const response = await api.get<ChatListResponse>(CHATS_ENDPOINT);
  return response.chats;
}

/**
 * Fetch a single chat with all messages
 */
export async function getChat(chatId: string): Promise<Chat> {
  const response = await api.get<ChatDetailResponse>(`${CHATS_ENDPOINT}/${chatId}`);
  return response.chat;
}

/**
 * Create a new chat
 */
export async function createChat(data: CreateChatRequest): Promise<Chat> {
  const response = await api.post<CreateChatResponse>(CHATS_ENDPOINT, data);
  return response.chat;
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
  data: UpdateChatRequest
): Promise<Chat> {
  const response = await api.patch<ChatDetailResponse>(
    `${CHATS_ENDPOINT}/${chatId}`,
    data
  );
  return response.chat;
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

/**
 * Archive a chat (soft delete)
 */
export async function archiveChat(chatId: string): Promise<void> {
  await api.post(`${CHATS_ENDPOINT}/${chatId}/archive`);
}
