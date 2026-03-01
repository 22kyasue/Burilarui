import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as authApi from '../api/auth';
import { setAuthToken, setRefreshToken, clearAuthTokens, getAuthToken, getRefreshToken } from '../api/client';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan?: 'free' | 'pro' | 'enterprise';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  loginWithApple: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const USER_CACHE_KEY = 'burilar_user_cache';

function saveUserCache(u: User) {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
}

function loadUserCache(): User | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearUserCache() {
  localStorage.removeItem(USER_CACHE_KEY);
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  const setAndCacheUser = useCallback((u: User) => {
    setUser(u);
    saveUserCache(u);
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Show cached user immediately to avoid flash
      const cached = loadUserCache();
      if (cached) setUser(cached);

      try {
        const userData = await authApi.getCurrentUser();
        setAndCacheUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
          plan: userData.plan,
        });
      } catch (err) {
        // Token might be expired, try to refresh
        const refreshTokenVal = getRefreshToken();
        if (refreshTokenVal) {
          try {
            const refreshResponse = await authApi.refreshToken(refreshTokenVal);
            setAuthToken(refreshResponse.accessToken);
            const userData = await authApi.getCurrentUser();
            setAndCacheUser({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              avatar: userData.avatar,
              plan: userData.plan,
            });
          } catch {
            // Refresh failed, clear tokens
            clearAuthTokens();
            clearUserCache();
          }
        } else {
          clearAuthTokens();
          clearUserCache();
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(email, password);
      setAuthToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setAndCacheUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        avatar: response.user.avatar,
        plan: response.user.plan,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ログインに失敗しました';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.loginWithGoogle(token);
      setAuthToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setAndCacheUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        avatar: response.user.avatar,
        plan: response.user.plan,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Googleログインに失敗しました';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithApple = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real implementation, this would open an Apple OAuth popup/redirect
      // and receive a token back. For now, we'll simulate with a placeholder.
      const mockToken = 'apple-oauth-token'; // Replace with actual OAuth flow
      const response = await authApi.loginWithApple(mockToken);
      setAuthToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setAndCacheUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        avatar: response.user.avatar,
        plan: response.user.plan,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Appleログインに失敗しました';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.register(email, password, name);
      setAuthToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setAndCacheUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        avatar: response.user.avatar,
        plan: response.user.plan,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '登録に失敗しました';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors, still clear local state
    } finally {
      clearAuthTokens();
      clearUserCache();
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        loginWithGoogle,
        loginWithApple,
        register,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
