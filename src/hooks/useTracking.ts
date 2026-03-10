import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  TrackingListItem,
  TrackingWithUpdates,
  CreateTrackingRequest,
  UpdateTrackingRequest,
  TrackingUpdatesResponse,
} from '../types/tracking';
import * as trackingApi from '../api/trackings';

export function useTracking() {
  const [trackings, setTrackings] = useState<TrackingListItem[]>([]);
  const [selectedTracking, setSelectedTracking] = useState<TrackingWithUpdates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await trackingApi.getTrackings();
      setTrackings(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch trackings';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTracking = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const tracking = await trackingApi.getTracking(id);
      setSelectedTracking(tracking);
      return tracking;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch tracking');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTracking = useCallback(async (data: CreateTrackingRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await trackingApi.createTracking(data);
      toast.success('Tracking created');
      await fetchTrackings();
      return response.tracking;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create tracking';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchTrackings]);

  const updateTracking = useCallback(async (id: string, data: UpdateTrackingRequest) => {
    setError(null);
    try {
      const updated = await trackingApi.updateTracking(id, data);
      setTrackings(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      if (selectedTracking?.id === id) {
        setSelectedTracking(prev => prev ? { ...prev, ...updated } : prev);
      }
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update tracking');
      return null;
    }
  }, [selectedTracking]);

  const deleteTracking = useCallback(async (id: string) => {
    setError(null);
    try {
      await trackingApi.deleteTracking(id);
      toast.success('Tracking deleted');
      setTrackings(prev => prev.filter(t => t.id !== id));
      if (selectedTracking?.id === id) {
        setSelectedTracking(null);
      }
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete tracking';
      setError(msg);
      toast.error(msg);
      return false;
    }
  }, [selectedTracking]);

  const executeTracking = useCallback(async (id: string) => {
    setError(null);
    try {
      const result = await trackingApi.executeTracking(id);
      if (result.update) {
        toast.success('New update found');
      } else {
        toast.info(result.message || 'No new updates');
      }
      await fetchTracking(id);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to execute tracking';
      setError(msg);
      toast.error(msg);
      return null;
    }
  }, [fetchTracking]);

  const markUpdatesRead = useCallback(async (trackingId: string, updateIds: string[]) => {
    try {
      await trackingApi.markUpdatesAsRead(trackingId, updateIds);
      if (selectedTracking?.id === trackingId) {
        setSelectedTracking(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            unreadCount: Math.max(0, prev.unreadCount - updateIds.length),
            updates: prev.updates.map(u =>
              updateIds.includes(u.id) ? { ...u, isRead: true } : u
            ),
          };
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark updates read');
    }
  }, [selectedTracking]);

  const markAllUpdatesRead = useCallback(async (trackingId: string) => {
    try {
      await trackingApi.markAllUpdatesAsRead(trackingId);
      if (selectedTracking?.id === trackingId) {
        setSelectedTracking(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            unreadCount: 0,
            updates: prev.updates.map(u => ({ ...u, isRead: true })),
          };
        });
      }
      setTrackings(prev => prev.map(t =>
        t.id === trackingId ? { ...t, unreadCount: 0 } : t
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark all updates read');
    }
  }, [selectedTracking]);

  const getUpdates = useCallback(async (
    trackingId: string,
    options?: { page?: number; pageSize?: number }
  ): Promise<TrackingUpdatesResponse | null> => {
    try {
      return await trackingApi.getTrackingUpdates(trackingId, options);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch updates');
      return null;
    }
  }, []);

  return {
    trackings,
    selectedTracking,
    loading,
    error,
    fetchTrackings,
    fetchTracking,
    createTracking,
    updateTracking,
    deleteTracking,
    executeTracking,
    markUpdatesRead,
    markAllUpdatesRead,
    getUpdates,
    clearError: () => setError(null),
  };
}
