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

/** Public — no auth needed. login/page.tsx uses this to decide which SSO buttons to render. */
export async function ssoStatusRequest(): Promise<SsoStatusResponse> {
  const res = await fetch(`${baseUrl}/auth/sso/status`, { cache: 'no-store' });
  if (!res.ok) return { oidc: false, saml: false };
  return res.json();
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await fetch(`${baseUrl}/auth/logout`, {
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
  const res = await fetch(`${baseUrl}/auth/sso/oidc/provision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-sso-internal-secret': process.env.SSO_INTERNAL_SECRET ?? '' },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  return res.json();
}

export function authHeaders(accessToken: string): Record<string, string> {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };
}

export async function listProjects(
  accessToken: string,
  status: ProjectStatus = 'ACTIVE',
  organizationId?: string,
): Promise<PaginatedResponse<ProjectResponse>> {
  const query = new URLSearchParams({ status });
  if (organizationId) query.set('organizationId', organizationId);
  const res = await fetch(`${baseUrl}/projects?${query.toString()}`, {
    headers: authHeaders(accessToken),
    cache: 'no-store',
  });
  if (!res.ok) return { data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };
  return res.json();
}

export async function getProject(accessToken: string, id: string): Promise<ProjectResponse | null> {
  const res = await fetch(`${baseUrl}/projects/${id}`, { headers: authHeaders(accessToken), cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function createProject(
  accessToken: string,
  body: CreateProjectRequest,
): Promise<ProjectResponse | { error: string }> {
  const res = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  if (res.status === 201) return res.json();
  const errBody = await res.json().catch(() => ({}));
  return { error: errBody.message ?? 'Could not create project' };
}

export async function updateProject(
  accessToken: string,
  id: string,
  body: UpdateProjectRequest,
): Promise<ProjectResponse | { error: string }> {
  const res = await fetch(`${baseUrl}/projects/${id}`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  if (res.ok) return res.json();
  const errBody = await res.json().catch(() => ({}));
  return { error: errBody.message ?? 'Could not update project' };
}

export async function archiveProject(accessToken: string, id: string): Promise<void> {
  await fetch(`${baseUrl}/projects/${id}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  }).catch(() => undefined);
}
