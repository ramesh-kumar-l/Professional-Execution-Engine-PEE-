import type { AnalyticsSummaryResponse, AnalyticsTimeTrackingResponse, AnalyticsVelocityResponse } from '@pee/types';
import { authHeaders, baseUrl } from './api-client';
import { fetchWithTimeout } from './fetch-with-timeout';

const EMPTY_SUMMARY: AnalyticsSummaryResponse = {
  projectsByStatus: {},
  goalsByStatus: {},
  tasksByStatus: {},
  totalTimeTrackedSeconds: 0,
  aiRecommendations: { byStatus: {}, acceptanceRate: null },
};

export async function getAnalyticsSummary(accessToken: string): Promise<AnalyticsSummaryResponse> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/analytics/summary`, { headers: authHeaders(accessToken), cache: 'no-store' });
    if (!res.ok) return EMPTY_SUMMARY;
    return res.json();
  } catch {
    return EMPTY_SUMMARY;
  }
}

export async function getAnalyticsVelocity(accessToken: string, days = 30): Promise<AnalyticsVelocityResponse> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/analytics/velocity?days=${days}`, {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    });
    if (!res.ok) return { days, points: [] };
    return res.json();
  } catch {
    return { days, points: [] };
  }
}

export async function getAnalyticsTimeTracking(
  accessToken: string,
  groupBy: 'goal' | 'project' = 'goal',
): Promise<AnalyticsTimeTrackingResponse> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/analytics/time-tracking?groupBy=${groupBy}`, {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    });
    if (!res.ok) return { groupBy, entries: [] };
    return res.json();
  } catch {
    return { groupBy, entries: [] };
  }
}
