/**
 * API Module
 * Re-exports all API utilities
 */

// Core client
export { api, ApiClientError, setAuthToken, getAuthToken, clearAuthTokens } from './client';

// Auth API
export {
  login,
  loginWithGoogle,
  loginWithApple,
  logout,
  refreshToken,
  getCurrentUser,
  register,
} from './auth';

// Search API
export { search } from './search';
export type { SearchRequest, SearchResponse } from './search';

// Tracking API
export {
  getTrackings,
  getTracking,
  createTracking,
  updateTracking,
  toggleTrackingActive,
  toggleTrackingPin,
  executeTracking,
  deleteTracking,
  markUpdatesAsRead,
  markAllUpdatesAsRead,
  getTrackingUpdates,
} from './trackings';

// Chat API
export {
  getChats,
  createChat,
  getChat,
  updateChat,
  deleteChat,
  addMessage,
} from './chats';

// Notifications API
export {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  submitNotificationFeedback,
} from './notifications';

// Types
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  RequestOptions,
  AuthTokens,
} from './types';
