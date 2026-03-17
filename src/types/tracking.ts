/**
 * Tracking Type Definitions
 * Aligned with backend REST API (Phase 3)
 */

export interface TrackingSource {
  id: string;
  url: string;
  title: string;
}

export interface TrackingUpdate {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  sources?: TrackingSource[];
  isRead: boolean;
}

export interface Tracking {
  id: string;
  title: string;
  query: string;
  description?: string;
  isActive: boolean;
  isPinned: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'custom';
  customFrequencyHours?: number;
  notificationEnabled: boolean;
  status: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  updateCount: number;
  unreadCount: number;
  sources?: string[];
}

export interface TrackingWithUpdates extends Tracking {
  updates: TrackingUpdate[];
}

export interface TrackingListItem {
  id: string;
  title: string;
  query: string;
  description?: string;
  isActive: boolean;
  isPinned: boolean;
  frequency: string;
  status: string;
  imageUrl?: string;
  updatedAt: string;
  updateCount: number;
  unreadCount: number;
  latestUpdate?: string;
}

export interface CreateTrackingRequest {
  query: string;
  searchResult?: string;
  frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'custom';
  customFrequencyHours?: number;
  notificationEnabled?: boolean;
}

export interface CreateTrackingResponse {
  tracking: Tracking;
}

export interface UpdateTrackingRequest {
  title?: string;
  isActive?: boolean;
  isPinned?: boolean;
  query?: string;
  frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'custom';
  customFrequencyHours?: number;
  notificationEnabled?: boolean;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  detailLevel?: 'summary' | 'normal' | 'detailed';
  sources?: string[];
}

export interface TrackingListResponse {
  trackings: TrackingListItem[];
}

export interface TrackingDetailResponse {
  tracking: TrackingWithUpdates;
}

export interface ExecuteTrackingResponse {
  update?: TrackingUpdate;
  message?: string;
}

export interface MarkUpdatesReadRequest {
  updateIds: string[];
}

export interface TrackingUpdatesResponse {
  updates: TrackingUpdate[];
  total: number;
}
