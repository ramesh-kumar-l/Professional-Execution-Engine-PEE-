import type {
  AuthTokens,
  CreateProjectRequest,
  PaginatedResponse,
  ProjectResponse,
  ProjectStatus,
  SsoProvisionResponse,
  SsoStatusResponse,
  UpdateProjectRequest,
  UserProfile,
} from '@pee/types';
import { fetchWithTimeout } from './fetch-with-timeout';

/**
 * Server-only client for the NestJS auth API. Called from Auth.js callbacks
 * and Server Actions — never imported into a Client Component, so the
 * internal API URL and raw tokens never reach the browser (BFF pattern).
 */
export const baseUrl = process.env.INTERNAL_API_URL ?? 'http://localhost:3001';

export async function loginRequest(
  email: string,
  password: string,
): Promise<{ user: UserProfile; tokens: AuthTokens } | null> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function refreshRequest(refreshToken: string): Promise<AuthTokens | null> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function registerRequest(
  email: string,
  password: string,
  displayName: string,
): Promise<UserProfile | { error: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    if (res.status === 201) return res.json();

    const body = await res.json().catch(() => ({}));
    return { error: body.message ?? 'Registration failed' };
  } catch {
    return { error: 'Registration request timed out. Please try again.' };
  }
}

/** Public — no auth needed. login/page.tsx uses this to decide which SSO buttons to render. */
export async function ssoStatusRequest(): Promise<SsoStatusResponse> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/auth/sso/status`, { cache: 'no-store' });
    if (!res.ok) return { oidc: false, saml: false };
    return res.json();
  } catch {
    return { oidc: false, saml: false };
  }
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await fetchWithTimeout(`${baseUrl}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => undefined);
}

/** Server-to-server, secret-header-guarded — see services/auth's SsoProvisionGuard. */
export async function provisionOidcUser(input: {
  providerName: string;
  providerUserId: string;
  email: string;
  displayName: string;
}): Promise<SsoProvisionResponse | null> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/auth/sso/oidc/provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sso-internal-secret': process.env.SSO_INTERNAL_SECRET ?? '' },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function authHeaders(accessToken: string): Record<string, string> {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };
}

export async function listProjects(
  accessToken: string,
  status: ProjectStatus = 'ACTIVE',
  organizationId?: string,
): Promise<PaginatedResponse<ProjectResponse>> {
  const empty = { data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };
  const query = new URLSearchParams({ status });
  if (organizationId) query.set('organizationId', organizationId);
  try {
    const res = await fetchWithTimeout(`${baseUrl}/projects?${query.toString()}`, {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    });
    if (!res.ok) return empty;
    return res.json();
  } catch {
    return empty;
  }
}

export async function getProject(accessToken: string, id: string): Promise<ProjectResponse | null> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/projects/${id}`, { headers: authHeaders(accessToken), cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function createProject(
  accessToken: string,
  body: CreateProjectRequest,
): Promise<ProjectResponse | { error: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/projects`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    });
    if (res.status === 201) return res.json();
    const errBody = await res.json().catch(() => ({}));
    return { error: errBody.message ?? 'Could not create project' };
  } catch {
    return { error: 'Request timed out. Please try again.' };
  }
}

export async function updateProject(
  accessToken: string,
  id: string,
  body: UpdateProjectRequest,
): Promise<ProjectResponse | { error: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/projects/${id}`, {
      method: 'PATCH',
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
    const errBody = await res.json().catch(() => ({}));
    return { error: errBody.message ?? 'Could not update project' };
  } catch {
    return { error: 'Request timed out. Please try again.' };
  }
}

export async function archiveProject(accessToken: string, id: string): Promise<void> {
  await fetchWithTimeout(`${baseUrl}/projects/${id}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  }).catch(() => undefined);
}
