/**
 * User & Plan Management API Functions
 * Endpoints for user account, settings, and subscription management
 */

import { api } from './client';
import type {
  User,
  UserResponse,
  UserSettings,
  Plan,
  PlansResponse,
  Subscription,
  UsageStats,
  UsageResponse,
  BillingHistoryItem,
  BillingHistoryResponse,
  PaymentMethod,
  PaymentMethodsResponse,
  UpdateUserRequest,
  UpdateUserSettingsRequest,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CancelSubscriptionRequest,
  AddPaymentMethodRequest,
} from '../types/user';

const USER_ENDPOINT = '/user';
const PLANS_ENDPOINT = '/plans';
const SUBSCRIPTIONS_ENDPOINT = '/subscriptions';

// ============================================
// User Profile
// ============================================

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<UserResponse>(USER_ENDPOINT);
  return response.user;
}

/**
 * Update user profile
 */
export async function updateUser(data: UpdateUserRequest): Promise<User> {
  const response = await api.patch<UserResponse>(USER_ENDPOINT, data);
  return response.user;
}

/**
 * Delete user account
 */
export async function deleteAccount(password: string): Promise<void> {
  await api.delete(USER_ENDPOINT, {
    headers: { 'X-Confirm-Password': password },
  });
}

// ============================================
// User Settings
// ============================================

/**
 * Get user settings
 */
export async function getUserSettings(): Promise<UserSettings> {
  return api.get<UserSettings>(`${USER_ENDPOINT}/settings`);
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  data: UpdateUserSettingsRequest
): Promise<UserSettings> {
  return api.put<UserSettings>(`${USER_ENDPOINT}/settings`, data);
}

// ============================================
// Plans
// ============================================

/**
 * Get all available plans
 */
export async function getPlans(): Promise<Plan[]> {
  const response = await api.get<PlansResponse>(PLANS_ENDPOINT);
  return response.plans;
}

/**
 * Get a specific plan by ID
 */
export async function getPlan(planId: string): Promise<Plan> {
  return api.get<Plan>(`${PLANS_ENDPOINT}/${planId}`);
}

// ============================================
// Subscriptions
// ============================================

/**
 * Get current subscription
 */
export async function getSubscription(): Promise<Subscription> {
  return api.get<Subscription>(SUBSCRIPTIONS_ENDPOINT);
}

/**
 * Create a new subscription (upgrade from free)
 */
export async function createSubscription(
  data: CreateSubscriptionRequest
): Promise<Subscription> {
  return api.post<Subscription>(SUBSCRIPTIONS_ENDPOINT, data);
}

/**
 * Update subscription (change plan or billing cycle)
 */
export async function updateSubscription(
  data: UpdateSubscriptionRequest
): Promise<Subscription> {
  return api.patch<Subscription>(SUBSCRIPTIONS_ENDPOINT, data);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  data?: CancelSubscriptionRequest
): Promise<Subscription> {
  return api.post<Subscription>(`${SUBSCRIPTIONS_ENDPOINT}/cancel`, data);
}

/**
 * Reactivate a canceled subscription (before period ends)
 */
export async function reactivateSubscription(): Promise<Subscription> {
  return api.post<Subscription>(`${SUBSCRIPTIONS_ENDPOINT}/reactivate`);
}

// ============================================
// Usage & Billing
// ============================================

/**
 * Get current usage statistics
 */
export async function getUsage(): Promise<UsageStats> {
  const response = await api.get<UsageResponse>(`${USER_ENDPOINT}/usage`);
  return response.usage;
}

/**
 * Get billing history
 */
export async function getBillingHistory(options?: {
  limit?: number;
  offset?: number;
}): Promise<BillingHistoryResponse> {
  return api.get<BillingHistoryResponse>(`${USER_ENDPOINT}/billing-history`, {
    params: options,
  });
}

/**
 * Download invoice PDF
 */
export async function getInvoiceUrl(invoiceId: string): Promise<string> {
  const response = await api.get<{ url: string }>(
    `${USER_ENDPOINT}/invoices/${invoiceId}/download`
  );
  return response.url;
}

// ============================================
// Payment Methods
// ============================================

/**
 * Get all payment methods
 */
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const response = await api.get<PaymentMethodsResponse>(
    `${USER_ENDPOINT}/payment-methods`
  );
  return response.paymentMethods;
}

/**
 * Add a new payment method
 */
export async function addPaymentMethod(
  data: AddPaymentMethodRequest
): Promise<PaymentMethod> {
  return api.post<PaymentMethod>(`${USER_ENDPOINT}/payment-methods`, data);
}

/**
 * Set a payment method as default
 */
export async function setDefaultPaymentMethod(
  paymentMethodId: string
): Promise<void> {
  await api.post(`${USER_ENDPOINT}/payment-methods/${paymentMethodId}/default`);
}

/**
 * Remove a payment method
 */
export async function removePaymentMethod(
  paymentMethodId: string
): Promise<void> {
  await api.delete(`${USER_ENDPOINT}/payment-methods/${paymentMethodId}`);
}
