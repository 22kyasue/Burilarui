/**
 * API Client
 * Fetch wrapper with convenience methods and error handling
 */

import type { ApiError, RequestOptions } from './types';

// Configuration
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Token storage (can be replaced with more secure storage later)
let authToken: string | null = null;

/**
 * Set the authentication token
 */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Get the current authentication token
 */
export function getAuthToken(): string | null {
  return authToken;
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
  const url = new URL(endpoint, BASE_URL.startsWith('http') ? BASE_URL : window.location.origin + BASE_URL);

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
