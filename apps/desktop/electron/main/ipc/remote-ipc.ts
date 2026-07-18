import { ipcMain } from 'electron';
import { AuthSession } from '../auth/auth-session';
import { IPC_CHANNELS } from './ipc-channels';

async function parseJsonOrError(res: Response, fallbackMessage: string): Promise<unknown> {
  if (res.ok) return res.json();
  const body = await res.json().catch(() => ({}));
  return { error: (body as { message?: string }).message ?? fallbackMessage };
}

/**
 * Online-only surfaces that @pee/local-client's sync registry deliberately doesn't cover
 * (execution sessions, AI suggestions, analytics) — thin passthroughs to the exact same
 * services/api REST contracts apps/web already calls, reusing AuthSession's token custody
 * instead of duplicating auth handling per handler.
 */
export function registerRemoteIpc(authSession: AuthSession): void {
  ipcMain.handle(IPC_CHANNELS.executionStart, async (_event, taskId: string) => {
    const res = await authSession.authedFetch(`/tasks/${taskId}/execution/start`, { method: 'POST' });
    return parseJsonOrError(res, 'Could not start task');
  });

  ipcMain.handle(IPC_CHANNELS.executionComplete, async (_event, taskId: string) => {
    const res = await authSession.authedFetch(`/tasks/${taskId}/execution/complete`, { method: 'POST' });
    return parseJsonOrError(res, 'Could not complete task');
  });

  ipcMain.handle(IPC_CHANNELS.aiGenerateSuggestions, async (_event, goalId: string) => {
    const res = await authSession.authedFetch(`/goals/${goalId}/ai/task-suggestions`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return parseJsonOrError(res, 'Could not generate AI suggestions');
  });

  ipcMain.handle(IPC_CHANNELS.aiGetPendingSuggestion, async (_event, goalId: string) => {
    const res = await authSession.authedFetch(`/goals/${goalId}/ai/task-suggestions`);
    if (!res.ok) return null;
    const body = (await res.json()) as { data: Array<{ status: string }> };
    return body.data.find((recommendation) => recommendation.status === 'PENDING') ?? null;
  });

  ipcMain.handle(IPC_CHANNELS.aiAcceptRecommendation, async (_event, id: string, acceptedIndices: number[]) => {
    const res = await authSession.authedFetch(`/ai/recommendations/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ acceptedIndices }),
    });
    return parseJsonOrError(res, 'Could not accept AI suggestions');
  });

  ipcMain.handle(IPC_CHANNELS.aiDismissRecommendation, async (_event, id: string) => {
    await authSession.authedFetch(`/ai/recommendations/${id}/dismiss`, { method: 'POST' }).catch(() => undefined);
  });

  ipcMain.handle(IPC_CHANNELS.analyticsGetSummary, async () => {
    const res = await authSession.authedFetch('/analytics/summary');
    return res.ok ? res.json() : null;
  });

  ipcMain.handle(IPC_CHANNELS.analyticsGetVelocity, async (_event, days = 30) => {
    const res = await authSession.authedFetch(`/analytics/velocity?days=${days}`);
    return res.ok ? res.json() : { days, points: [] };
  });

  ipcMain.handle(IPC_CHANNELS.analyticsGetTimeTracking, async (_event, groupBy: 'goal' | 'project' = 'goal') => {
    const res = await authSession.authedFetch(`/analytics/time-tracking?groupBy=${groupBy}`);
    return res.ok ? res.json() : { groupBy, entries: [] };
  });
}
