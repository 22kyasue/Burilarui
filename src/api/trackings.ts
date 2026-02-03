/**
 * Tracking API Functions
 * Endpoints for tracking/notebook management
 */

import { api } from './client';
import type {
  Tracking,
  TrackingListItem,
  TrackingWithUpdates,
  TrackingUpdate,
  TrackingListResponse,
  TrackingDetailResponse,
  CreateTrackingRequest,
  CreateTrackingResponse,
  UpdateTrackingRequest,
  ExecuteTrackingResponse,
  MarkUpdatesReadRequest,
} from '../types/tracking';

const TRACKINGS_ENDPOINT = '/trackings';

/**
 * Fetch all trackings for the current user
 */
export async function getTrackings(): Promise<TrackingListItem[]> {
  const response = await api.get<TrackingListResponse>(TRACKINGS_ENDPOINT);
  return response.trackings;
}

/**
 * Fetch a single tracking with all updates
 */
export async function getTracking(trackingId: string): Promise<TrackingWithUpdates> {
  const response = await api.get<TrackingDetailResponse>(
    `${TRACKINGS_ENDPOINT}/${trackingId}`
  );
  return response.tracking;
}

/**
 * Create a new tracking
 */
export async function createTracking(
  data: CreateTrackingRequest
): Promise<CreateTrackingResponse> {
  return api.post<CreateTrackingResponse>(TRACKINGS_ENDPOINT, data);
}

/**
 * Update tracking settings
 */
export async function updateTracking(
  trackingId: string,
  data: UpdateTrackingRequest
): Promise<Tracking> {
  const response = await api.patch<TrackingDetailResponse>(
    `${TRACKINGS_ENDPOINT}/${trackingId}`,
    data
  );
  return response.tracking;
}

/**
 * Toggle tracking active state
 */
export async function toggleTrackingActive(
  trackingId: string,
  isActive: boolean
): Promise<Tracking> {
  return updateTracking(trackingId, { isActive });
}

/**
 * Toggle tracking pin state
 */
export async function toggleTrackingPin(
  trackingId: string,
  isPinned: boolean
): Promise<Tracking> {
  return updateTracking(trackingId, { isPinned });
}

/**
 * Update tracking frequency
 */
export async function updateTrackingFrequency(
  trackingId: string,
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'custom',
  customFrequencyHours?: number
): Promise<Tracking> {
  return updateTracking(trackingId, { frequency, customFrequencyHours });
}

/**
 * Manually execute/trigger a tracking to get new updates
 */
export async function executeTracking(trackingId: string): Promise<TrackingUpdate> {
  const response = await api.post<ExecuteTrackingResponse>(
    `${TRACKINGS_ENDPOINT}/${trackingId}/execute`
  );
  return response.update;
}

/**
 * Delete a tracking
 */
export async function deleteTracking(trackingId: string): Promise<void> {
  await api.delete(`${TRACKINGS_ENDPOINT}/${trackingId}`);
}

/**
 * Mark updates as read
 */
export async function markUpdatesAsRead(
  trackingId: string,
  updateIds: string[]
): Promise<void> {
  await api.post<void>(`${TRACKINGS_ENDPOINT}/${trackingId}/updates/read`, {
    updateIds,
  } as MarkUpdatesReadRequest);
}

/**
 * Mark all updates as read for a tracking
 */
export async function markAllUpdatesAsRead(trackingId: string): Promise<void> {
  await api.post<void>(`${TRACKINGS_ENDPOINT}/${trackingId}/updates/read-all`);
}

/**
 * Get updates for a specific tracking (paginated)
 */
export async function getTrackingUpdates(
  trackingId: string,
  options?: { page?: number; pageSize?: number }
): Promise<TrackingUpdate[]> {
  const response = await api.get<{ updates: TrackingUpdate[] }>(
    `${TRACKINGS_ENDPOINT}/${trackingId}/updates`,
    { params: options }
  );
  return response.updates;
}
