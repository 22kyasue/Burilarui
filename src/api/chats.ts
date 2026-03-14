/**
 * Chat API Functions
 * Endpoints for chat management and messaging
 */

import { api } from './client';
import type { Chat } from '../types/chat';

const BASE = '/chats';

export async function getChats(): Promise<Chat[]> {
  const response = await api.get<{ chats: Chat[] }>(BASE);
  return response.chats;
}

export async function createChat(data?: { title?: string }): Promise<Chat> {
  return api.post<Chat>(BASE, data);
}

export async function getChat(id: string): Promise<Chat> {
  return api.get<Chat>(`${BASE}/${id}`);
}

export async function updateChat(id: string, data: Partial<Chat>): Promise<Chat> {
  return api.put<Chat>(`${BASE}/${id}`, data);
}

export async function deleteChat(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

export async function addMessage(
  chatId: string,
  message: { id: string; content: string; role: string; timestamp: string }
): Promise<Chat> {
  return api.post<Chat>(`${BASE}/${chatId}/messages`, message);
}
