import type {
  CreateOrganizationRequest,
  InviteMemberRequest,
  MemberResponse,
  OrganizationResponse,
  UpdateMemberRoleRequest,
} from '@pee/types';
import { authHeaders, baseUrl } from './api-client';

export async function listOrganizations(accessToken: string): Promise<OrganizationResponse[]> {
  const res = await fetch(`${baseUrl}/organizations`, { headers: authHeaders(accessToken), cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function createOrganization(
  accessToken: string,
  body: CreateOrganizationRequest,
): Promise<OrganizationResponse | { error: string }> {
  const res = await fetch(`${baseUrl}/organizations`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  if (res.status === 201) return res.json();
  const errBody = await res.json().catch(() => ({}));
  return { error: errBody.message ?? 'Could not create organization' };
}

export async function listMembers(accessToken: string, organizationId: string): Promise<MemberResponse[]> {
  const res = await fetch(`${baseUrl}/organizations/${organizationId}/members`, {
    headers: authHeaders(accessToken),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function inviteMember(
  accessToken: string,
  organizationId: string,
  body: InviteMemberRequest,
): Promise<MemberResponse | { error: string }> {
  const res = await fetch(`${baseUrl}/organizations/${organizationId}/members`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  if (res.status === 201) return res.json();
  const errBody = await res.json().catch(() => ({}));
  return { error: errBody.message ?? 'Could not invite member' };
}

export async function updateMemberRole(
  accessToken: string,
  organizationId: string,
  userId: string,
  body: UpdateMemberRoleRequest,
): Promise<MemberResponse | { error: string }> {
  const res = await fetch(`${baseUrl}/organizations/${organizationId}/members/${userId}`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  if (res.ok) return res.json();
  const errBody = await res.json().catch(() => ({}));
  return { error: errBody.message ?? 'Could not update member role' };
}

export async function removeMember(accessToken: string, organizationId: string, userId: string): Promise<void> {
  await fetch(`${baseUrl}/organizations/${organizationId}/members/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  }).catch(() => undefined);
}
