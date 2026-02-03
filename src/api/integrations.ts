/**
 * Integrations API Functions
 * Endpoints for third-party service integrations
 */

import { api } from './client';
import type {
  Integration,
  IntegrationService,
  IntegrationListResponse,
  ConnectIntegrationResponse,
  OAuthCallbackRequest,
  OAuthCallbackResponse,
  DisconnectIntegrationResponse,
  UpdateIntegrationRequest,
  SyncStatusResponse,
} from '../types/integrations';

const INTEGRATIONS_ENDPOINT = '/integrations';

/**
 * Fetch all available integrations and their connection status
 */
export async function getIntegrations(): Promise<Integration[]> {
  const response = await api.get<IntegrationListResponse>(INTEGRATIONS_ENDPOINT);
  return response.integrations;
}

/**
 * Get a single integration by service
 */
export async function getIntegration(service: IntegrationService): Promise<Integration> {
  return api.get<Integration>(`${INTEGRATIONS_ENDPOINT}/${service}`);
}

/**
 * Initiate OAuth connection flow for a service
 * Returns the authorization URL to redirect the user to
 */
export async function connectIntegration(
  service: IntegrationService,
  options?: { redirectUri?: string; scopes?: string[] }
): Promise<ConnectIntegrationResponse> {
  return api.post<ConnectIntegrationResponse>(
    `${INTEGRATIONS_ENDPOINT}/${service}/connect`,
    options
  );
}

/**
 * Handle OAuth callback after user authorizes
 * Call this from your OAuth redirect handler
 */
export async function handleOAuthCallback(
  service: IntegrationService,
  data: OAuthCallbackRequest
): Promise<OAuthCallbackResponse> {
  return api.post<OAuthCallbackResponse>(
    `${INTEGRATIONS_ENDPOINT}/${service}/callback`,
    data
  );
}

/**
 * Disconnect an integration
 */
export async function disconnectIntegration(
  service: IntegrationService
): Promise<DisconnectIntegrationResponse> {
  return api.post<DisconnectIntegrationResponse>(
    `${INTEGRATIONS_ENDPOINT}/${service}/disconnect`
  );
}

/**
 * Update integration settings (e.g., enable/disable sub-apps)
 */
export async function updateIntegration(
  service: IntegrationService,
  data: UpdateIntegrationRequest
): Promise<Integration> {
  return api.patch<Integration>(`${INTEGRATIONS_ENDPOINT}/${service}`, data);
}

/**
 * Toggle a sub-app within an integration
 */
export async function toggleSubApp(
  service: IntegrationService,
  subAppId: string,
  enabled: boolean
): Promise<Integration> {
  return updateIntegration(service, {
    subApps: [{ id: subAppId, enabled }],
  });
}

/**
 * Trigger a sync for an integration
 */
export async function syncIntegration(
  service: IntegrationService,
  options?: { fullSync?: boolean }
): Promise<SyncStatusResponse> {
  return api.post<SyncStatusResponse>(
    `${INTEGRATIONS_ENDPOINT}/${service}/sync`,
    options
  );
}

/**
 * Get sync status for an integration
 */
export async function getSyncStatus(
  service: IntegrationService
): Promise<SyncStatusResponse> {
  return api.get<SyncStatusResponse>(
    `${INTEGRATIONS_ENDPOINT}/${service}/sync-status`
  );
}

/**
 * Refresh access token for an integration (if needed)
 */
export async function refreshIntegrationToken(
  service: IntegrationService
): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>(
    `${INTEGRATIONS_ENDPOINT}/${service}/refresh-token`
  );
}
