import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

describe('API Client Token Management', () => {
  let setAuthToken: (token: string | null) => void;
  let getAuthToken: () => string | null;
  let clearAuthTokens: () => void;
  let setRefreshToken: (token: string | null) => void;
  let getRefreshToken: () => string | null;

  beforeEach(async () => {
    localStorageMock.clear();
    vi.resetModules();
    const client = await import('../api/client');
    setAuthToken = client.setAuthToken;
    getAuthToken = client.getAuthToken;
    clearAuthTokens = client.clearAuthTokens;
    setRefreshToken = client.setRefreshToken;
    getRefreshToken = client.getRefreshToken;
  });

  it('sets and gets auth token', () => {
    setAuthToken('test-token');
    expect(getAuthToken()).toBe('test-token');
  });

  it('persists auth token to localStorage', () => {
    setAuthToken('persisted-token');
    expect(localStorageMock.getItem('burilar_auth_token')).toBe('persisted-token');
  });

  it('clears auth token', () => {
    setAuthToken('to-clear');
    clearAuthTokens();
    expect(getAuthToken()).toBeNull();
    expect(localStorageMock.getItem('burilar_auth_token')).toBeNull();
  });

  it('sets and gets refresh token', () => {
    setRefreshToken('refresh-token');
    expect(getRefreshToken()).toBe('refresh-token');
  });

  it('clears both tokens', () => {
    setAuthToken('access');
    setRefreshToken('refresh');
    clearAuthTokens();
    expect(getAuthToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
