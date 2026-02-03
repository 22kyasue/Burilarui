/**
 * Common API Types
 * Shared interfaces for API requests and responses
 */

// Base API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// API error structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// Request options
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

// Auth token storage (flexible for JWT or other token-based auth)
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}
