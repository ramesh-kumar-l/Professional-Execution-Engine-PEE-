import type { ActiveExecutionResponse, ExecutionEventResponse, PaginatedResponse, TaskExecutionSessionResponse } from '@pee/types';
import { authHeaders, baseUrl } from './api-client';
import { fetchWithTimeout } from './fetch-with-timeout';

export async function startTaskExecution(
  accessToken: string,
  taskId: string,
): Promise<TaskExecutionSessionResponse | { error: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/tasks/${taskId}/execution/start`, {
      method: 'POST',
      headers: authHeaders(accessToken),
    });
    if (res.status === 201) return res.json();
    const errBody = await res.json().catch(() => ({}));
    return { error: errBody.message ?? 'Could not start task' };
  } catch {
    return { error: 'Request timed out. Please try again.' };
  }
}

export async function completeTaskExecution(
  accessToken: string,
  taskId: string,
): Promise<TaskExecutionSessionResponse | { error: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/tasks/${taskId}/execution/complete`, {
      method: 'POST',
      headers: authHeaders(accessToken),
    });
    if (res.ok) return res.json();
    const errBody = await res.json().catch(() => ({}));
    return { error: errBody.message ?? 'Could not complete task' };
  } catch {
    return { error: 'Request timed out. Please try again.' };
  }
}

export async function listGoalActivity(
  accessToken: string,
  goalId: string,
): Promise<PaginatedResponse<ExecutionEventResponse>> {
  const empty = { data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };
  try {
    const res = await fetchWithTimeout(`${baseUrl}/goals/${goalId}/activity`, {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    });
    if (!res.ok) return empty;
    return res.json();
  } catch {
    return empty;
  }
}

export async function listActiveExecutions(accessToken: string): Promise<ActiveExecutionResponse[]> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/execution/active`, {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
