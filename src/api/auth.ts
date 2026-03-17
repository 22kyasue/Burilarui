/**
 * Authentication API endpoints
 */

import { api } from './client';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/login', { email, password });
}

/**
 * Login with Google OAuth token
 */
export async function loginWithGoogle(token: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/google', { token });
}

/**
 * Login with Apple OAuth token
 */
export async function loginWithApple(token: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/apple', { token });
}

/**
 * Logout current session — sends refresh token for server-side revocation
 */
export async function logout(refreshToken?: string): Promise<void> {
  return api.post<void>('/auth/logout', { refreshToken: refreshToken || '' });
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  return api.post<{ accessToken: string; refreshToken: string; expiresAt: number }>('/auth/refresh', { refreshToken });
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  return api.get<User>('/auth/me');
}

/**
 * Update current user's profile
 */
export async function updateProfile(data: { name: string }): Promise<User> {
  return api.patch<User>('/auth/me', data);
}

/**
 * Register new user
 */
export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/register', { email, password, name });
}
