import { api } from './client';

export interface PlanInfo {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number | null;
  features: string[];
  limits: {
    active_trackings: number;
    searches_per_day: number;
    chats_per_day: number;
    messages_per_chat: number;
  };
}

export interface UsageStat {
  used: number;
  limit: number;
  remaining: number;
}

export interface BillingStatus {
  plan: 'free' | 'pro' | 'enterprise';
  displayName: string;
  priceMonthly: number | null;
  features: string[];
  usage: {
    searches_per_day: UsageStat;
    chats_per_day: UsageStat;
  };
  activeTrackings: {
    used: number;
    limit: number;
  };
  stripeCustomerId: string | null;
  subscriptionStatus: string | null;
}

export async function getPlans(): Promise<PlanInfo[]> {
  const data = await api.get<{ plans: PlanInfo[] }>('/billing/plans');
  return data.plans;
}

export async function getBillingStatus(): Promise<BillingStatus> {
  return api.get<BillingStatus>('/billing/status');
}

export async function createCheckout(): Promise<string> {
  const data = await api.post<{ url: string }>('/billing/checkout');
  return data.url;
}

export async function createPortalSession(): Promise<string> {
  const data = await api.post<{ url: string }>('/billing/portal');
  return data.url;
}
