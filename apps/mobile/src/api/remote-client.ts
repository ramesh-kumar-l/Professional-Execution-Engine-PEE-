import type {
  AITaskSuggestion,
  AnalyticsSummaryResponse,
  AnalyticsTimeTrackingResponse,
  AnalyticsVelocityResponse,
} from '@pee/types';
import { MobileAuthSession } from '../auth/mobile-auth-session';

/**
 * Online-only surfaces MobileStore/MobileSyncClient's sync scope deliberately doesn't cover
 * (execution sessions, AI suggestions, analytics) — thin passthroughs to the exact same
 * services/api REST contracts apps/web/apps/desktop already call. Mobile has no main/renderer
 * IPC boundary, so this is called directly from screens instead of through an IPC handler,
 * reusing MobileAuthSession's token custody instead of duplicating auth handling per call.
 */
export class RemoteClient {
  constructor(private readonly session: MobileAuthSession) {}

  async startTaskExecution(taskId: string): Promise<unknown> {
    const res = await this.session.authedFetch(`/tasks/${taskId}/execution/start`, { method: 'POST' });
    return res.ok ? res.json() : { error: 'Could not start task' };
  }

  async completeTaskExecution(taskId: string): Promise<unknown> {
    const res = await this.session.authedFetch(`/tasks/${taskId}/execution/complete`, { method: 'POST' });
    return res.ok ? res.json() : { error: 'Could not complete task' };
  }

  async generateAiSuggestions(goalId: string): Promise<unknown> {
    const res = await this.session.authedFetch(`/goals/${goalId}/ai/task-suggestions`, { method: 'POST', body: JSON.stringify({}) });
    return res.ok ? res.json() : { error: 'Could not generate AI suggestions' };
  }

  async getPendingAiSuggestion(goalId: string): Promise<{ id: string; suggestions: AITaskSuggestion[] } | null> {
    const res = await this.session.authedFetch(`/goals/${goalId}/ai/task-suggestions`);
    if (!res.ok) return null;
    const body = (await res.json()) as { data: Array<{ id: string; status: string; suggestions: AITaskSuggestion[] }> };
    const pending = body.data.find((recommendation) => recommendation.status === 'PENDING');
    return pending ? { id: pending.id, suggestions: pending.suggestions } : null;
  }

  async acceptAiRecommendation(id: string, acceptedIndices: number[]): Promise<unknown> {
    const res = await this.session.authedFetch(`/ai/recommendations/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ acceptedIndices }),
    });
    return res.ok ? res.json() : { error: 'Could not accept AI suggestions' };
  }

  async dismissAiRecommendation(id: string): Promise<void> {
    await this.session.authedFetch(`/ai/recommendations/${id}/dismiss`, { method: 'POST' }).catch(() => undefined);
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummaryResponse | null> {
    const res = await this.session.authedFetch('/analytics/summary');
    return res.ok ? res.json() : null;
  }

  async getAnalyticsVelocity(days = 30): Promise<AnalyticsVelocityResponse> {
    const res = await this.session.authedFetch(`/analytics/velocity?days=${days}`);
    return res.ok ? res.json() : { days, points: [] };
  }

  async getAnalyticsTimeTracking(groupBy: 'goal' | 'project' = 'goal'): Promise<AnalyticsTimeTrackingResponse> {
    const res = await this.session.authedFetch(`/analytics/time-tracking?groupBy=${groupBy}`);
    return res.ok ? res.json() : { groupBy, entries: [] };
  }
}
