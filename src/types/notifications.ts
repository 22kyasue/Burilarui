/**
 * Notification Type Definitions
 * Interfaces for notifications and notification settings
 */

// Individual notification
export interface Notification {
  id: string;
  type: 'tracking_update' | 'system' | 'digest' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  trackingId?: string;
  updateId?: string;
  actionUrl?: string;
}

// Notification channel settings
export interface NotificationChannels {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

// Per-tracking notification settings
export interface TrackingNotificationSettings {
  trackingId: string;
  enabled: boolean;
  channels: NotificationChannels;
  notifyOnNewUpdate: boolean;
  notifyOnDailyDigest: boolean;
  notifyOnWeeklyDigest: boolean;
  notifyOnNoUpdate: boolean;
  detailLevel: 'summary' | 'detailed' | 'full';
}

// Global notification settings
export interface GlobalNotificationSettings {
  channels: NotificationChannels;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;   // HH:mm format
  digestFrequency: 'daily' | 'weekly' | 'none';
  digestTime?: string;      // HH:mm format
  defaultDetailLevel: 'summary' | 'detailed' | 'full';
}

// Combined notification settings response
export interface NotificationSettingsResponse {
  global: GlobalNotificationSettings;
  trackingOverrides: TrackingNotificationSettings[];
}

// Request to update global settings
export interface UpdateGlobalSettingsRequest {
  channels?: Partial<NotificationChannels>;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  digestFrequency?: 'daily' | 'weekly' | 'none';
  digestTime?: string;
  defaultDetailLevel?: 'summary' | 'detailed' | 'full';
}

// Request to update tracking-specific settings
export interface UpdateTrackingNotificationRequest {
  enabled?: boolean;
  channels?: Partial<NotificationChannels>;
  notifyOnNewUpdate?: boolean;
  notifyOnDailyDigest?: boolean;
  notifyOnWeeklyDigest?: boolean;
  notifyOnNoUpdate?: boolean;
  detailLevel?: 'summary' | 'detailed' | 'full';
}

// Notification list response
export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Unread count response
export interface UnreadCountResponse {
  count: number;
}
