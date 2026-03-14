/**
 * API Client
 * Fetch wrapper with convenience methods and error handling
 */

import { toast } from 'sonner';
import type { ApiError, RequestOptions } from './types';
import { trackError } from '../utils/errorTracker';

// Configuration
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AUTH_TOKEN_KEY = 'burilar_auth_token';
const REFRESH_TOKEN_KEY = 'burilar_refresh_token';

// Token storage with localStorage persistence
let authToken: string | null = null;
let refreshTokenValue: string | null = null;

// Initialize from localStorage on module load
if (typeof window !== 'undefined') {
  authToken = localStorage.getItem(AUTH_TOKEN_KEY);
  refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Set the authentication token (persists to localStorage)
 */
export function setAuthToken(token: string | null): void {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }
}

/**
 * Get the current authentication token
 */
export function getAuthToken(): string | null {
  return authToken;
}

/**
 * Set the refresh token (persists to localStorage)
 */
export function setRefreshToken(token: string | null): void {
  refreshTokenValue = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
}

/**
 * Get the refresh token
 */
export function getRefreshToken(): string | null {
  return refreshTokenValue;
}

/**
 * Clear all auth tokens (used on logout)
 */
export function clearAuthTokens(): void {
  setAuthToken(null);
  setRefreshToken(null);
}

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, string[]>;
  /** True if the API client already showed a toast for this error */
  public readonly toastedByClient: boolean;

  constructor(status: number, error: ApiError, toastedByClient = false) {
    super(error.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = error.code;
    this.details = error.details;
    this.toastedByClient = toastedByClient;
  }
}

/**
 * Build URL with query parameters
 */
function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  // Remove leading slash from endpoint and ensure BASE_URL format
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const baseUrl = BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/';

  // Build full URL
  const fullUrl = BASE_URL.startsWith('http')
    ? baseUrl + cleanEndpoint
    : window.location.origin + baseUrl + cleanEndpoint;

  const url = new URL(fullUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Build request headers
 */
function buildHeaders(customHeaders?: Record<string, string>): Headers {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...customHeaders,
  });

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  return headers;
}

/**
 * Refresh the access token using the stored refresh token.
 * Returns true if refresh succeeded, false otherwise.
 */
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  // Deduplicate concurrent refresh calls
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const url = buildUrl('/auth/refresh');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearAuthTokens();
        return false;
      }

      const data = await res.json();
      setAuthToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      return true;
    } catch {
      clearAuthTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response, retryFn?: () => Promise<Response>): Promise<T> {
  // Handle no content responses
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    const error: ApiError = data.error || {
      code: 'UNKNOWN_ERROR',
      message: data.message || 'An unexpected error occurred',
    };

    let toasted = false;

    // Try refresh on 401 (expired access token)
    if (response.status === 401 && error.code === 'INVALID_TOKEN' && retryFn) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the original request with new token
        const retryResponse = await retryFn();
        return handleResponse<T>(retryResponse); // No retry on second failure
      }
      // Refresh failed — clear tokens and show message
      toast.error('セッションが切れました。再度ログインしてください。');
      clearAuthTokens();
      toasted = true;
    } else if (response.status === 401) {
      toast.error('セッションが切れました。再度ログインしてください。');
      clearAuthTokens();
      toasted = true;
    } else if (response.status >= 500) {
      toast.error('サーバーエラーが発生しました。しばらくしてからお試しください。');
      toasted = true;
    }

    const apiError = new ApiClientError(response.status, error, toasted);
    trackError(apiError, 'api', { status: response.status, code: error.code, endpoint: response.url });
    throw apiError;
  }

  return data as T;
}

/**
 * Core request function
 */
async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const url = buildUrl(
    endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
    options.params
  );

  const config: RequestInit = {
    method,
    headers: buildHeaders(options.headers),
    signal: options.signal,
  };

  if (body !== undefined && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const doFetch = () => {
    // Rebuild headers to pick up refreshed token
    const freshConfig = { ...config, headers: buildHeaders(options.headers) };
    return fetch(url, freshConfig);
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    // Network failure (offline, DNS error, CORS, etc.)
    // Don't toast if the request was intentionally aborted
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    toast.error('ネットワーク接続を確認してください');
    throw err;
  }
  return handleResponse<T>(response, doFetch);
}

/**
 * API client methods
 */
export const api = {
  /**
   * GET request
   */
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', endpoint, undefined, options);
  },

  /**
   * POST request
   */
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', endpoint, body, options);
  },

  /**
   * PUT request
   */
  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PUT', endpoint, body, options);
  },

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', endpoint, body, options);
  },

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', endpoint, undefined, options);
  },
};

export default api;
