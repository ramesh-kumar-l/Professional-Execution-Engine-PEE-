import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import { app, safeStorage } from 'electron';
import type { AuthTokens, UserProfile } from '@pee/types';

const API_BASE_URL = process.env.PEE_API_URL ?? 'http://localhost:3001';

function tokenFilePath(): string {
  return path.join(app.getPath('userData'), 'refresh-token.enc');
}

/**
 * Token custody for the desktop client — the same "server holds the token, UI never sees it"
 * BFF pattern apps/web's Next.js server already applies, just relocated to Electron's main
 * process. The renderer only ever sees a UserProfile, never a token (see auth-ipc.ts).
 */
export class AuthSession {
  private accessToken: string | null = null;
  private user: UserProfile | null = null;

  getUser(): UserProfile | null {
    return this.user;
  }

  /** For synchronous consumers (SyncClient's getAccessToken option) that can't await a refresh. */
  peekAccessToken(): string {
    if (!this.accessToken) throw new Error('Not authenticated');
    return this.accessToken;
  }

  /** Proactively refreshes using the stored refresh token; returns whether it succeeded. */
  async refreshNow(): Promise<boolean> {
    const refreshToken = this.readStoredRefreshToken();
    if (!refreshToken) return false;
    return (await this.refresh(refreshToken)) !== null;
  }

  /** Called once at app startup: re-authenticates from a stored refresh token, if any. */
  async restore(): Promise<UserProfile | null> {
    const refreshToken = this.readStoredRefreshToken();
    if (!refreshToken) return null;
    const tokens = await this.refresh(refreshToken);
    if (!tokens) return null;
    const user = await this.fetchProfile(tokens.accessToken);
    this.user = user;
    return user;
  }

  async login(email: string, password: string): Promise<{ user: UserProfile } | { error: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { error: 'Invalid email or password.' };

    const body = (await res.json()) as { user: UserProfile; tokens: AuthTokens };
    this.accessToken = body.tokens.accessToken;
    this.user = body.user;
    this.persistRefreshToken(body.tokens.refreshToken);
    return { user: body.user };
  }

  async logout(): Promise<void> {
    const refreshToken = this.readStoredRefreshToken();
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    this.accessToken = null;
    this.user = null;
    this.clearStoredRefreshToken();
  }

  /** Every call into services/api from the main process should go through this — retries once
   *  with a refreshed access token on a 401, instead of every IPC handler reimplementing that. */
  async authedFetch(pathAndQuery: string, init: RequestInit = {}): Promise<Response> {
    const doFetch = (token: string) =>
      fetch(`${API_BASE_URL}${pathAndQuery}`, {
        ...init,
        headers: { ...init.headers, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

    if (!this.accessToken) throw new Error('Not authenticated');
    let res = await doFetch(this.accessToken);
    if (res.status !== 401) return res;

    const refreshToken = this.readStoredRefreshToken();
    if (!refreshToken) return res;
    const tokens = await this.refresh(refreshToken);
    if (!tokens) return res;
    return doFetch(tokens.accessToken);
  }

  private async refresh(refreshToken: string): Promise<AuthTokens | null> {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const tokens = (await res.json()) as AuthTokens;
    this.accessToken = tokens.accessToken;
    this.persistRefreshToken(tokens.refreshToken);
    return tokens;
  }

  private async fetchProfile(accessToken: string): Promise<UserProfile | null> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    return (await res.json()) as UserProfile;
  }

  private persistRefreshToken(refreshToken: string): void {
    if (!safeStorage.isEncryptionAvailable()) {
      writeFileSync(tokenFilePath(), refreshToken, 'utf8');
      return;
    }
    writeFileSync(tokenFilePath(), safeStorage.encryptString(refreshToken));
  }

  private readStoredRefreshToken(): string | null {
    if (!existsSync(tokenFilePath())) return null;
    const raw = readFileSync(tokenFilePath());
    if (!safeStorage.isEncryptionAvailable()) return raw.toString('utf8');
    try {
      return safeStorage.decryptString(raw);
    } catch {
      return null;
    }
  }

  private clearStoredRefreshToken(): void {
    if (existsSync(tokenFilePath())) unlinkSync(tokenFilePath());
  }
}
