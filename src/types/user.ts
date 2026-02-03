/**
 * User & Plan Type Definitions
 * Interfaces for user account, settings, and subscription management
 */

// Plan identifiers
export type PlanId = 'free' | 'pro' | 'ultra';

// Billing cycle
export type BillingCycle = 'monthly' | 'yearly';

// Plan feature
export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string | number;
}

// Available plan
export interface Plan {
  id: PlanId;
  name: string;
  description?: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: PlanFeature[];
  popular?: boolean;
}

// User's current subscription
export interface Subscription {
  planId: PlanId;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
}

// Usage statistics
export interface UsageStats {
  searches: { used: number; limit: number | null };
  trackings: { used: number; limit: number | null };
  notifications: { used: number; limit: number | null };
  periodStart: Date;
  periodEnd: Date;
}

// Billing history item
export interface BillingHistoryItem {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  invoiceId: string;
  invoiceUrl?: string;
  description?: string;
}

// Payment method
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  isDefault: boolean;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

// User profile
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
  subscription: Subscription;
}

// User settings/preferences
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  emailMarketing: boolean;
  emailProductUpdates: boolean;
}

// Response types
export interface UserResponse {
  user: User;
}

export interface PlansResponse {
  plans: Plan[];
}

export interface UsageResponse {
  usage: UsageStats;
}

export interface BillingHistoryResponse {
  history: BillingHistoryItem[];
  hasMore: boolean;
}

export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
}

// Request types
export interface UpdateUserRequest {
  name?: string;
  avatarUrl?: string;
}

export interface UpdateUserSettingsRequest {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  emailMarketing?: boolean;
  emailProductUpdates?: boolean;
}

export interface CreateSubscriptionRequest {
  planId: PlanId;
  billingCycle: BillingCycle;
  paymentMethodId?: string;
}

export interface UpdateSubscriptionRequest {
  planId?: PlanId;
  billingCycle?: BillingCycle;
}

export interface CancelSubscriptionRequest {
  reason?: string;
  feedback?: string;
  cancelImmediately?: boolean;
}

export interface AddPaymentMethodRequest {
  type: 'card';
  token: string; // From Stripe.js or similar
  setAsDefault?: boolean;
}
