import * as SecureStore from 'expo-secure-store';
import type { AuthTokens, UserProfile } from '@pee/types';

const REFRESH_TOKEN_KEY = 'pee_refresh_token';

export function resolveApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_PEE_API_URL ?? 'http://localhost:3001';
}

/**
 * Mirrors apps/desktop/electron/main/auth/auth-session.ts near-exactly — same "one place holds
 * the token" BFF-style custody, same login/refresh/logout/authedFetch shape. The one substitution
 * is expo-secure-store (iOS Keychain / Android Keystore) in place of Electron's safeStorage for
 * the refresh token. React Native has no main/renderer split, so this is a plain singleton class
 * exposed to the component tree via auth-context.tsx, rather than an IPC bridge.
 */
export class MobileAuthSession {
  private accessToken: string | null = null;
  private user: UserProfile | null = null;
  private readonly apiBaseUrl = resolveApiBaseUrl();

  getUser(): UserProfile | null {
    return this.user;
  }

  peekAccessToken(): string {
    if (!this.accessToken) throw new Error('Not authenticated');
    return this.accessToken;
  }

  /** Proactively refreshes using the stored refresh token; returns whether it succeeded. */
  async refreshNow(): Promise<boolean> {
    const refreshToken = await this.readStoredRefreshToken();
    if (!refreshToken) return false;
    return (await this.refresh(refreshToken)) !== null;
  }

  async restore(): Promise<UserProfile | null> {
    const refreshToken = await this.readStoredRefreshToken();
    if (!refreshToken) return null;
    const tokens = await this.refresh(refreshToken);
    if (!tokens) return null;
    const user = await this.fetchProfile(tokens.accessToken);
    this.user = user;
    return user;
  }

  async login(email: string, password: string): Promise<{ user: UserProfile } | { error: string }> {
    const res = await fetch(`${this.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { error: 'Invalid email or password.' };

    const body = (await res.json()) as { user: UserProfile; tokens: AuthTokens };
    this.accessToken = body.tokens.accessToken;
    this.user = body.user;
    await this.persistRefreshToken(body.tokens.refreshToken);
    return { user: body.user };
  }

  async logout(): Promise<void> {
    const refreshToken = await this.readStoredRefreshToken();
    if (refreshToken) {
      await fetch(`${this.apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    this.accessToken = null;
    this.user = null;
    await this.clearStoredRefreshToken();
  }

  /** Every call into services/api from a screen should go through this — retries once with a
   *  refreshed access token on a 401, instead of every screen reimplementing that. */
  async authedFetch(pathAndQuery: string, init: RequestInit = {}): Promise<Response> {
    const doFetch = (token: string) =>
      fetch(`${this.apiBaseUrl}${pathAndQuery}`, {
        ...init,
        headers: { ...init.headers, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

    if (!this.accessToken) throw new Error('Not authenticated');
    const res = await doFetch(this.accessToken);
    if (res.status !== 401) return res;

    const refreshToken = await this.readStoredRefreshToken();
    if (!refreshToken) return res;
    const tokens = await this.refresh(refreshToken);
    if (!tokens) return res;
    return doFetch(tokens.accessToken);
  }

  private async refresh(refreshToken: string): Promise<AuthTokens | null> {
    const res = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const tokens = (await res.json()) as AuthTokens;
    this.accessToken = tokens.accessToken;
    await this.persistRefreshToken(tokens.refreshToken);
    return tokens;
  }

  private async fetchProfile(accessToken: string): Promise<UserProfile | null> {
    const res = await fetch(`${this.apiBaseUrl}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    return (await res.json()) as UserProfile;
  }

  private async persistRefreshToken(refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }

  private async readStoredRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  }

  private async clearStoredRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}
