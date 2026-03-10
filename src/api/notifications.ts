/**
 * Notifications API Functions
 * Endpoints aligned with backend Phase 3 routes
 */

import { api } from './client';
import type { NotificationListResponse, UnreadCountResponse } from '../types/notifications';

const BASE = '/notifications';

export async function getNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<NotificationListResponse> {
  return api.get<NotificationListResponse>(BASE, { params: options });
}

export async function getUnreadCount(): Promise<number> {
  const response = await api.get<UnreadCountResponse>(`${BASE}/unread-count`);
  return response.count;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.patch(`${BASE}/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.post(`${BASE}/mark-all-read`);
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

export async function submitNotificationFeedback(
  id: string,
  feedback: 'useful' | 'not_useful'
): Promise<void> {
  await api.post(`${BASE}/${id}/feedback`, { feedback });
}
