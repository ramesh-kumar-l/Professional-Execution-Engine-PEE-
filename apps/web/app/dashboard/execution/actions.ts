'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { completeTaskExecution } from '@/lib/execution-api-client';

export async function completeActiveTaskAction(goalId: string, taskId: string): Promise<void> {
  const session = await auth();
  if (session?.accessToken) {
    await completeTaskExecution(session.accessToken, taskId);
  }
  revalidatePath('/dashboard/execution');
  revalidatePath(`/dashboard/goals/${goalId}`);
}
