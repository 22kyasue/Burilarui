/**
 * Notification Type Definitions
 * Aligned with backend REST API (Phase 3)
 */

import type { TrackingSource } from './tracking';

export interface Notification {
  id: string;
  type: 'update' | 'system' | 'info';
  title: string;
  message: string;
  trackingId?: string;
  read: boolean;
  feedback?: 'useful' | 'not_useful';
  details?: {
    changes?: string[];
    sources?: TrackingSource[];
  };
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}
