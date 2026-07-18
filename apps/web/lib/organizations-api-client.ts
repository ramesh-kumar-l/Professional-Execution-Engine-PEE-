import type {
  CreateOrganizationRequest,
  InviteMemberRequest,
  MemberResponse,
  OrganizationResponse,
  UpdateMemberRoleRequest,
} from '@pee/types';
import { authHeaders, baseUrl } from './api-client';
import { fetchWithTimeout } from './fetch-with-timeout';

export async function listOrganizations(accessToken: string): Promise<OrganizationResponse[]> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/organizations`, { headers: authHeaders(accessToken), cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function createOrganization(
  accessToken: string,
  body: CreateOrganizationRequest,
): Promise<OrganizationResponse | { error: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/organizations`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    });
    if (res.status === 201) return res.json();
    const errBody = await res.json().catch(() => ({}));
    return { error: errBody.message ?? 'Could not create organization' };
  } catch {
    return { error: 'Request timed out. Please try again.' };
  }
}

export async function listMembers(accessToken: string, organizationId: string): Promise<MemberResponse[]> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/organizations/${organizationId}/members`, {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function inviteMember(
  accessToken: string,
  organizationId: string,
  body: InviteMemberRequest,
): Promise<MemberResponse | { error: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/organizations/${organizationId}/members`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    });
    if (res.status === 201) return res.json();
    const errBody = await res.json().catch(() => ({}));
    return { error: errBody.message ?? 'Could not invite member' };
  } catch {
    return { error: 'Request timed out. Please try again.' };
  }
}

export async function updateMemberRole(
  accessToken: string,
  organizationId: string,
  userId: string,
  body: UpdateMemberRoleRequest,
): Promise<MemberResponse | { error: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/organizations/${organizationId}/members/${userId}`, {
      method: 'PATCH',
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
    const errBody = await res.json().catch(() => ({}));
    return { error: errBody.message ?? 'Could not update member role' };
  } catch {
    return { error: 'Request timed out. Please try again.' };
  }
}

export async function removeMember(accessToken: string, organizationId: string, userId: string): Promise<void> {
  await fetchWithTimeout(`${baseUrl}/organizations/${organizationId}/members/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  }).catch(() => undefined);
}
