'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createGoal } from '@/lib/planning-api-client';
import type { GoalFormState } from '@/components/GoalForm';

export async function createGoalAction(projectId: string, formData: FormData): Promise<GoalFormState> {
  const session = await auth();
  if (!session?.accessToken) {
    return { error: 'Session expired — please log in again.' };
  }

  const title = String(formData.get('title') ?? '');
  const description = String(formData.get('description') ?? '');
  const targetDate = String(formData.get('targetDate') ?? '');

  const result = await createGoal(session.accessToken, projectId, {
    title,
    description: description || undefined,
    targetDate: targetDate || undefined,
  });
  if ('error' in result) {
    return { error: result.error };
  }

  redirect(`/dashboard/projects/${projectId}/goals`);
}
