/**
 * Integration Type Definitions
 * Interfaces for third-party service integrations
 */

// Integration service identifiers
export type IntegrationService =
  | 'github'
  | 'google_workspace'
  | 'notion'
  | 'ticktick'
  | 'youtube_music';

// Integration category
export type IntegrationCategory = 'productivity' | 'media' | 'other';

// Sub-app within an integration (e.g., Gmail within Google Workspace)
export interface IntegrationSubApp {
  id: string;
  name: string;
  handle: string;
  enabled: boolean;
  iconUrl?: string;
}

// Integration details
export interface Integration {
  id: string;
  service: IntegrationService;
  name: string;
  handle: string;
  description: string;
  category: IntegrationCategory;
  iconUrl?: string;
  isConnected: boolean;
  connectedAt?: Date;
  connectedAccount?: string;
  subApps?: IntegrationSubApp[];
  permissions?: string[];
  lastSyncAt?: Date;
  syncStatus?: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
}

// Integration list response
export interface IntegrationListResponse {
  integrations: Integration[];
}

// OAuth connect initiation response
export interface ConnectIntegrationResponse {
  authUrl: string;
  state: string;
}

// OAuth callback request (from redirect)
export interface OAuthCallbackRequest {
  code: string;
  state: string;
}

// OAuth callback response
export interface OAuthCallbackResponse {
  success: boolean;
  integration: Integration;
}

// Disconnect response
export interface DisconnectIntegrationResponse {
  success: boolean;
}

// Update integration settings request
export interface UpdateIntegrationRequest {
  subApps?: Array<{
    id: string;
    enabled: boolean;
  }>;
}

// Sync integration request
export interface SyncIntegrationRequest {
  fullSync?: boolean;
}

// Sync status response
export interface SyncStatusResponse {
  status: 'idle' | 'syncing' | 'error';
  lastSyncAt?: Date;
  itemsSynced?: number;
  errorMessage?: string;
}
