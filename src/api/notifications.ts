/**
 * Notifications API Functions
 * Endpoints for notifications and notification settings
 */

import { api } from './client';
import type {

  NotificationListResponse,
  NotificationSettingsResponse,
  GlobalNotificationSettings,
  TrackingNotificationSettings,
  UpdateGlobalSettingsRequest,
  UpdateTrackingNotificationRequest,
  UnreadCountResponse,
} from '../types/notifications';

const NOTIFICATIONS_ENDPOINT = '/notifications';

/**
 * Fetch all notifications for the current user
 */
export async function getNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<NotificationListResponse> {
  return api.get<NotificationListResponse>(NOTIFICATIONS_ENDPOINT, {
    params: options,
  });
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const response = await api.get<UnreadCountResponse>(
    `${NOTIFICATIONS_ENDPOINT}/unread-count`
  );
  return response.count;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await api.patch(`${NOTIFICATIONS_ENDPOINT}/${notificationId}/read`);
}

/**
 * Mark multiple notifications as read
 */
export async function markNotificationsAsRead(notificationIds: string[]): Promise<void> {
  await api.post(`${NOTIFICATIONS_ENDPOINT}/mark-read`, { notificationIds });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  await api.post(`${NOTIFICATIONS_ENDPOINT}/mark-all-read`);
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`${NOTIFICATIONS_ENDPOINT}/${notificationId}`);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await api.delete(`${NOTIFICATIONS_ENDPOINT}/all`);
}

// ============================================
// Notification Settings
// ============================================

/**
 * Get all notification settings (global + tracking overrides)
 */
export async function getNotificationSettings(): Promise<NotificationSettingsResponse> {
  return api.get<NotificationSettingsResponse>(`${NOTIFICATIONS_ENDPOINT}/settings`);
}

/**
 * Get global notification settings
 */
export async function getGlobalSettings(): Promise<GlobalNotificationSettings> {
  return api.get<GlobalNotificationSettings>(`${NOTIFICATIONS_ENDPOINT}/settings/global`);
}

/**
 * Update global notification settings
 */
export async function updateGlobalSettings(
  data: UpdateGlobalSettingsRequest
): Promise<GlobalNotificationSettings> {
  return api.put<GlobalNotificationSettings>(
    `${NOTIFICATIONS_ENDPOINT}/settings/global`,
    data
  );
}

/**
 * Get notification settings for a specific tracking
 */
export async function getTrackingNotificationSettings(
  trackingId: string
): Promise<TrackingNotificationSettings> {
  return api.get<TrackingNotificationSettings>(
    `${NOTIFICATIONS_ENDPOINT}/settings/tracking/${trackingId}`
  );
}

/**
 * Update notification settings for a specific tracking
 */
export async function updateTrackingNotificationSettings(
  trackingId: string,
  data: UpdateTrackingNotificationRequest
): Promise<TrackingNotificationSettings> {
  return api.put<TrackingNotificationSettings>(
    `${NOTIFICATIONS_ENDPOINT}/settings/tracking/${trackingId}`,
    data
  );
}

/**
 * Reset tracking notification settings to global defaults
 */
export async function resetTrackingNotificationSettings(
  trackingId: string
): Promise<void> {
  await api.delete(`${NOTIFICATIONS_ENDPOINT}/settings/tracking/${trackingId}`);
}

/**
 * Test notification delivery (sends a test notification)
 */
export async function sendTestNotification(channel: 'email' | 'push'): Promise<void> {
  await api.post(`${NOTIFICATIONS_ENDPOINT}/test`, { channel });
}
