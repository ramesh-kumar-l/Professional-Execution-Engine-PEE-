'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { acceptRecommendation, dismissRecommendation, generateTaskSuggestions } from '@/lib/ai-api-client';
import { completeTaskExecution, startTaskExecution } from '@/lib/execution-api-client';
import { archiveGoal, archiveTask, createTask, getGoal, updateGoal, updateTask } from '@/lib/planning-api-client';
import type { GoalFormState } from '@/components/GoalForm';
import type { TaskFormState } from '@/components/TaskForm';

export async function updateGoalAction(id: string, formData: FormData): Promise<GoalFormState> {
  const session = await auth();
  if (!session?.accessToken) {
    return { error: 'Session expired — please log in again.' };
  }

  const title = String(formData.get('title') ?? '');
  const description = String(formData.get('description') ?? '');
  const targetDate = String(formData.get('targetDate') ?? '');

  const result = await updateGoal(session.accessToken, id, {
    title,
    description: description || undefined,
    targetDate: targetDate || undefined,
  });
  if ('error' in result) {
    return { error: result.error };
  }

  redirect(`/dashboard/goals/${id}`);
}

export async function archiveGoalAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.accessToken) {
    redirect('/login');
  }
  const goal = await getGoal(session.accessToken, id);
  await archiveGoal(session.accessToken, id);
  redirect(goal ? `/dashboard/projects/${goal.projectId}/goals` : '/dashboard/projects');
}

export async function createTaskAction(goalId: string, formData: FormData): Promise<TaskFormState> {
  const session = await auth();
  if (!session?.accessToken) {
    return { error: 'Session expired — please log in again.' };
  }

  const title = String(formData.get('title') ?? '');
  const result = await createTask(session.accessToken, goalId, { title });
  if ('error' in result) {
    return { error: result.error };
  }
  revalidatePath(`/dashboard/goals/${goalId}`);
  return {};
}

export async function toggleTaskDoneAction(goalId: string, taskId: string, done: boolean): Promise<void> {
  const session = await auth();
  if (session?.accessToken) {
    await updateTask(session.accessToken, taskId, { status: done ? 'DONE' : 'TODO' });
  }
  revalidatePath(`/dashboard/goals/${goalId}`);
}

export async function archiveTaskAction(goalId: string, taskId: string): Promise<void> {
  const session = await auth();
  if (session?.accessToken) {
    await archiveTask(session.accessToken, taskId);
  }
  revalidatePath(`/dashboard/goals/${goalId}`);
}

export async function startTaskAction(goalId: string, taskId: string): Promise<void> {
  const session = await auth();
  if (session?.accessToken) {
    await startTaskExecution(session.accessToken, taskId);
  }
  revalidatePath(`/dashboard/goals/${goalId}`);
}

export async function completeTaskAction(goalId: string, taskId: string): Promise<void> {
  const session = await auth();
  if (session?.accessToken) {
    await completeTaskExecution(session.accessToken, taskId);
  }
  revalidatePath(`/dashboard/goals/${goalId}`);
}

export async function generateSuggestionsAction(goalId: string): Promise<void> {
  const session = await auth();
  if (session?.accessToken) {
    await generateTaskSuggestions(session.accessToken, goalId);
  }
  revalidatePath(`/dashboard/goals/${goalId}`);
}

export async function acceptRecommendationAction(
  goalId: string,
  recommendationId: string,
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (session?.accessToken) {
    const acceptedIndices = formData.getAll('suggestionIndex').map((value) => Number(value));
    if (acceptedIndices.length > 0) {
      await acceptRecommendation(session.accessToken, recommendationId, acceptedIndices);
    }
  }
  revalidatePath(`/dashboard/goals/${goalId}`);
}

export async function dismissRecommendationAction(goalId: string, recommendationId: string): Promise<void> {
  const session = await auth();
  if (session?.accessToken) {
    await dismissRecommendation(session.accessToken, recommendationId);
  }
  revalidatePath(`/dashboard/goals/${goalId}`);
}
