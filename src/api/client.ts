/**
 * API Client
 * Fetch wrapper with convenience methods and error handling
 */

import type { ApiError, RequestOptions } from './types';

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

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = error.code;
    this.details = error.details;
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
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
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
    throw new ApiClientError(response.status, error);
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

  const response = await fetch(url, config);
  return handleResponse<T>(response);
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
