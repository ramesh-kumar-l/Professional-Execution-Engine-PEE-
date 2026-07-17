'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { archiveProject, createProject, updateProject } from '@/lib/api-client';
import type { ProjectFormState } from '@/components/ProjectForm';

export async function createProjectAction(formData: FormData): Promise<ProjectFormState> {
  const session = await auth();
  if (!session?.accessToken) {
    return { error: 'Session expired — please log in again.' };
  }

  const name = String(formData.get('name') ?? '');
  const description = String(formData.get('description') ?? '');

  const result = await createProject(session.accessToken, { name, description: description || undefined });
  if ('error' in result) {
    return { error: result.error };
  }

  redirect('/dashboard/projects');
}

export async function updateProjectAction(id: string, formData: FormData): Promise<ProjectFormState> {
  const session = await auth();
  if (!session?.accessToken) {
    return { error: 'Session expired — please log in again.' };
  }

  const name = String(formData.get('name') ?? '');
  const description = String(formData.get('description') ?? '');

  const result = await updateProject(session.accessToken, id, { name, description: description || undefined });
  if ('error' in result) {
    return { error: result.error };
  }

  redirect('/dashboard/projects');
}

export async function archiveProjectAction(id: string): Promise<void> {
  const session = await auth();
  if (session?.accessToken) {
    await archiveProject(session.accessToken, id);
  }
  redirect('/dashboard/projects');
}
