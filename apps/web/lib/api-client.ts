import type { AuthTokens, UserProfile } from '@pee/types';

/**
 * Server-only client for the NestJS auth API. Called from Auth.js callbacks
 * and Server Actions — never imported into a Client Component, so the
 * internal API URL and raw tokens never reach the browser (BFF pattern).
 */
const baseUrl = process.env.INTERNAL_API_URL ?? 'http://localhost:3001';

export async function loginRequest(
  email: string,
  password: string,
): Promise<{ user: UserProfile; tokens: AuthTokens } | null> {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function refreshRequest(refreshToken: string): Promise<AuthTokens | null> {
  const res = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function registerRequest(
  email: string,
  password: string,
  displayName: string,
): Promise<UserProfile | { error: string }> {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  if (res.status === 201) return res.json();

  const body = await res.json().catch(() => ({}));
  return { error: body.message ?? 'Registration failed' };
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await fetch(`${baseUrl}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => undefined);
}
