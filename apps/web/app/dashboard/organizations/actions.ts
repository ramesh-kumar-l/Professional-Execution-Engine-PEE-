'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import type { InviteMemberFormState } from '@/components/InviteMemberForm';
import type { OrganizationFormState } from '@/components/OrganizationForm';
import { createOrganization, inviteMember, removeMember, updateMemberRole } from '@/lib/organizations-api-client';

export async function createOrganizationAction(formData: FormData): Promise<OrganizationFormState> {
  const session = await auth();
  if (!session?.accessToken) {
    return { error: 'Session expired — please log in again.' };
  }

  const name = String(formData.get('name') ?? '');
  const result = await createOrganization(session.accessToken, { name });
  if ('error' in result) {
    return { error: result.error };
  }

  redirect('/dashboard/organizations');
}

export async function inviteMemberAction(organizationId: string, formData: FormData): Promise<InviteMemberFormState> {
  const session = await auth();
  if (!session?.accessToken) {
    return { error: 'Session expired — please log in again.' };
  }

  const email = String(formData.get('email') ?? '');
  const role = formData.get('role') as 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  const result = await inviteMember(session.accessToken, organizationId, { email, role: role ?? undefined });
  if ('error' in result) {
    return { error: result.error };
  }

  redirect(`/dashboard/organizations/${organizationId}/members`);
}

export async function updateMemberRoleAction(
  organizationId: string,
  userId: string,
  role: 'OWNER' | 'ADMIN' | 'MEMBER',
): Promise<void> {
  const session = await auth();
  if (session?.accessToken) {
    await updateMemberRole(session.accessToken, organizationId, userId, { role });
  }
  redirect(`/dashboard/organizations/${organizationId}/members`);
}

export async function removeMemberAction(organizationId: string, userId: string): Promise<void> {
  const session = await auth();
  if (session?.accessToken) {
    await removeMember(session.accessToken, organizationId, userId);
  }
  redirect(`/dashboard/organizations/${organizationId}/members`);
}
