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
 * Logout current session
 */
export async function logout(): Promise<void> {
  return api.post<void>('/auth/logout');
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
  return api.post<{ accessToken: string; expiresAt: number }>('/auth/refresh', { refreshToken });
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  return api.get<User>('/auth/me');
}

/**
 * Register new user
 */
export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/register', { email, password, name });
}
