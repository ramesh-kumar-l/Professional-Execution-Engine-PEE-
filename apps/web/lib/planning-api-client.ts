import type {
  CreateGoalRequest,
  CreateTaskRequest,
  GoalResponse,
  PaginatedResponse,
  TaskResponse,
  UpdateGoalRequest,
  UpdateTaskRequest,
} from '@pee/types';
import { authHeaders, baseUrl } from './api-client';
import { fetchWithTimeout } from './fetch-with-timeout';

const EMPTY_PAGE = { data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };

export async function listGoals(accessToken: string, projectId: string): Promise<PaginatedResponse<GoalResponse>> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/projects/${projectId}/goals`, {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    });
    if (!res.ok) return EMPTY_PAGE;
    return res.json();
  } catch {
    return EMPTY_PAGE;
  }
}

export async function getGoal(accessToken: string, id: string): Promise<GoalResponse | null> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/goals/${id}`, { headers: authHeaders(accessToken), cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function createGoal(
  accessToken: string,
  projectId: string,
  body: CreateGoalRequest,
): Promise<GoalResponse | { error: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/projects/${projectId}/goals`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    });
    if (res.status === 201) return res.json();
    const errBody = await res.json().catch(() => ({}));
    return { error: errBody.message ?? 'Could not create goal' };
  } catch {
    return { error: 'Request timed out. Please try again.' };
  }
}

export async function updateGoal(
  accessToken: string,
  id: string,
  body: UpdateGoalRequest,
): Promise<GoalResponse | { error: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/goals/${id}`, {
      method: 'PATCH',
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
    const errBody = await res.json().catch(() => ({}));
    return { error: errBody.message ?? 'Could not update goal' };
  } catch {
    return { error: 'Request timed out. Please try again.' };
  }
}

export async function archiveGoal(accessToken: string, id: string): Promise<void> {
  await fetchWithTimeout(`${baseUrl}/goals/${id}`, { method: 'DELETE', headers: authHeaders(accessToken) }).catch(
    () => undefined,
  );
}

export async function listTasks(accessToken: string, goalId: string): Promise<PaginatedResponse<TaskResponse>> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/goals/${goalId}/tasks`, {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    });
    if (!res.ok) return EMPTY_PAGE;
    return res.json();
  } catch {
    return EMPTY_PAGE;
  }
}

export async function createTask(
  accessToken: string,
  goalId: string,
  body: CreateTaskRequest,
): Promise<TaskResponse | { error: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/goals/${goalId}/tasks`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    });
    if (res.status === 201) return res.json();
    const errBody = await res.json().catch(() => ({}));
    return { error: errBody.message ?? 'Could not create task' };
  } catch {
    return { error: 'Request timed out. Please try again.' };
  }
}

export async function updateTask(
  accessToken: string,
  id: string,
  body: UpdateTaskRequest,
): Promise<TaskResponse | { error: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/tasks/${id}`, {
      method: 'PATCH',
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
    const errBody = await res.json().catch(() => ({}));
    return { error: errBody.message ?? 'Could not update task' };
  } catch {
    return { error: 'Request timed out. Please try again.' };
  }
}

export async function archiveTask(accessToken: string, id: string): Promise<void> {
  await fetchWithTimeout(`${baseUrl}/tasks/${id}`, { method: 'DELETE', headers: authHeaders(accessToken) }).catch(
    () => undefined,
  );
}
