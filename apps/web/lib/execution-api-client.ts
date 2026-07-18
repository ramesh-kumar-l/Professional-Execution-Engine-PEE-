import type { ActiveExecutionResponse, ExecutionEventResponse, PaginatedResponse, TaskExecutionSessionResponse } from '@pee/types';
import { authHeaders, baseUrl } from './api-client';

export async function startTaskExecution(
  accessToken: string,
  taskId: string,
): Promise<TaskExecutionSessionResponse | { error: string }> {
  const res = await fetch(`${baseUrl}/tasks/${taskId}/execution/start`, {
    method: 'POST',
    headers: authHeaders(accessToken),
  });
  if (res.status === 201) return res.json();
  const errBody = await res.json().catch(() => ({}));
  return { error: errBody.message ?? 'Could not start task' };
}

export async function completeTaskExecution(
  accessToken: string,
  taskId: string,
): Promise<TaskExecutionSessionResponse | { error: string }> {
  const res = await fetch(`${baseUrl}/tasks/${taskId}/execution/complete`, {
    method: 'POST',
    headers: authHeaders(accessToken),
  });
  if (res.ok) return res.json();
  const errBody = await res.json().catch(() => ({}));
  return { error: errBody.message ?? 'Could not complete task' };
}

export async function listGoalActivity(
  accessToken: string,
  goalId: string,
): Promise<PaginatedResponse<ExecutionEventResponse>> {
  const res = await fetch(`${baseUrl}/goals/${goalId}/activity`, {
    headers: authHeaders(accessToken),
    cache: 'no-store',
  });
  if (!res.ok) return { data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };
  return res.json();
}

export async function listActiveExecutions(accessToken: string): Promise<ActiveExecutionResponse[]> {
  const res = await fetch(`${baseUrl}/execution/active`, {
    headers: authHeaders(accessToken),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}
