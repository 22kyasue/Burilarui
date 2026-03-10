/**
 * Tracking API Functions
 * Endpoints aligned with backend Phase 3 routes
 */

import { api } from './client';
import type {
  TrackingListItem,
  TrackingWithUpdates,
  TrackingListResponse,
  TrackingDetailResponse,
  CreateTrackingRequest,
  CreateTrackingResponse,
  UpdateTrackingRequest,
  ExecuteTrackingResponse,
  MarkUpdatesReadRequest,
  TrackingUpdatesResponse,
  Tracking,
} from '../types/tracking';

const BASE = '/trackings';

export async function getTrackings(): Promise<TrackingListItem[]> {
  const response = await api.get<TrackingListResponse>(BASE);
  return response.trackings;
}

export async function getTracking(id: string): Promise<TrackingWithUpdates> {
  const response = await api.get<TrackingDetailResponse>(`${BASE}/${id}`);
  return response.tracking;
}

export async function createTracking(data: CreateTrackingRequest): Promise<CreateTrackingResponse> {
  return api.post<CreateTrackingResponse>(BASE, data);
}

export async function updateTracking(id: string, data: UpdateTrackingRequest): Promise<Tracking> {
  const response = await api.patch<TrackingDetailResponse>(`${BASE}/${id}`, data);
  return response.tracking;
}

export async function toggleTrackingActive(id: string, isActive: boolean): Promise<Tracking> {
  return updateTracking(id, { isActive });
}

export async function toggleTrackingPin(id: string, isPinned: boolean): Promise<Tracking> {
  return updateTracking(id, { isPinned });
}

export async function executeTracking(id: string): Promise<ExecuteTrackingResponse> {
  return api.post<ExecuteTrackingResponse>(`${BASE}/${id}/execute`);
}

export async function deleteTracking(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

export async function markUpdatesAsRead(trackingId: string, updateIds: string[]): Promise<void> {
  await api.post<void>(`${BASE}/${trackingId}/updates/read`, { updateIds } as MarkUpdatesReadRequest);
}

export async function markAllUpdatesAsRead(trackingId: string): Promise<void> {
  await api.post<void>(`${BASE}/${trackingId}/updates/read-all`);
}

export async function getTrackingUpdates(
  trackingId: string,
  options?: { page?: number; pageSize?: number }
): Promise<TrackingUpdatesResponse> {
  return api.get<TrackingUpdatesResponse>(`${BASE}/${trackingId}/updates`, { params: options });
}
