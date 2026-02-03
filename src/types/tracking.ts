/**
 * Tracking/Notebook Type Definitions
 * Interfaces for tracking prompts and their updates
 */

// Source reference for an update
export interface TrackingSource {
  id: string;
  url: string;
  title: string;
}

// Individual update from a tracking prompt
export interface TrackingUpdate {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  sources?: TrackingSource[];
  isRead?: boolean;
}

// Tracking prompt/notebook
export interface Tracking {
  id: string;
  title: string;
  promptContent: string;
  description?: string;
  isActive: boolean;
  isPinned: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'custom';
  customFrequencyHours?: number;
  notificationEnabled: boolean;
  notificationGranularity: 'update' | 'prompt';
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt?: Date;
  updateCount: number;
  unreadCount: number;
}

// Tracking with full update history
export interface TrackingWithUpdates extends Tracking {
  updates: TrackingUpdate[];
}

// Tracking list item (lighter version)
export interface TrackingListItem {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  isPinned: boolean;
  frequency: string;
  updatedAt: Date;
  updateCount: number;
  unreadCount: number;
  latestUpdate?: string;
}

// Request to create a new tracking
export interface CreateTrackingRequest {
  title: string;
  promptContent: string;
  description?: string;
  template?: string;
  frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'custom';
  customFrequencyHours?: number;
  notificationEnabled?: boolean;
  notificationGranularity?: 'update' | 'prompt';
}

// Response when creating a tracking
export interface CreateTrackingResponse {
  tracking: Tracking;
  initialUpdate?: TrackingUpdate;
}

// Request to update tracking settings
export interface UpdateTrackingRequest {
  title?: string;
  promptContent?: string;
  description?: string;
  isActive?: boolean;
  isPinned?: boolean;
  frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'custom';
  customFrequencyHours?: number;
  notificationEnabled?: boolean;
  notificationGranularity?: 'update' | 'prompt';
}

// Response for tracking list
export interface TrackingListResponse {
  trackings: TrackingListItem[];
}

// Response for single tracking with updates
export interface TrackingDetailResponse {
  tracking: TrackingWithUpdates;
}

// Response when executing a tracking manually
export interface ExecuteTrackingResponse {
  update: TrackingUpdate;
}

// Mark updates as read request
export interface MarkUpdatesReadRequest {
  updateIds: string[];
}
