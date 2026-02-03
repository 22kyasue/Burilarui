/**
 * API Module
 * Re-exports all API utilities and types
 */

// Core client
export { api, ApiClientError, setAuthToken, getAuthToken } from './client';
export { useApi, useMutation } from './hooks';

// Chat API
export {
  getChats,
  getChat,
  createChat,
  sendMessage,
  updateChat,
  togglePinChat,
  deleteChat,
  archiveChat,
} from './chats';

// Tracking API
export {
  getTrackings,
  getTracking,
  createTracking,
  updateTracking,
  toggleTrackingActive,
  toggleTrackingPin,
  updateTrackingFrequency,
  executeTracking,
  deleteTracking,
  markUpdatesAsRead,
  markAllUpdatesAsRead,
  getTrackingUpdates,
} from './trackings';

// Notifications API
export {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationSettings,
  getGlobalSettings,
  updateGlobalSettings,
  getTrackingNotificationSettings,
  updateTrackingNotificationSettings,
  resetTrackingNotificationSettings,
  sendTestNotification,
} from './notifications';

// Integrations API
export {
  getIntegrations,
  getIntegration,
  connectIntegration,
  handleOAuthCallback,
  disconnectIntegration,
  updateIntegration,
  toggleSubApp,
  syncIntegration,
  getSyncStatus,
  refreshIntegrationToken,
} from './integrations';

// User & Plan API
export {
  getCurrentUser,
  updateUser,
  deleteAccount,
  getUserSettings,
  updateUserSettings,
  getPlans,
  getPlan,
  getSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  getUsage,
  getBillingHistory,
  getInvoiceUrl,
  getPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  removePaymentMethod,
} from './user';

// Types
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  RequestOptions,
  AuthTokens,
} from './types';
