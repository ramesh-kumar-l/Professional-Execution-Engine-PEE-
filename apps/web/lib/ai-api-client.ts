import type {
  AcceptRecommendationResponse,
  AIRecommendationResponse,
  PaginatedResponse,
} from '@pee/types';
import { authHeaders, baseUrl } from './api-client';
import { fetchWithTimeout } from './fetch-with-timeout';

export async function generateTaskSuggestions(
  accessToken: string,
  goalId: string,
): Promise<AIRecommendationResponse | { error: string }> {
  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/goals/${goalId}/ai/task-suggestions`,
      { method: 'POST', headers: authHeaders(accessToken), body: JSON.stringify({}) },
      15_000,
    );
    if (res.status === 201) return res.json();
    const errBody = await res.json().catch(() => ({}));
    return { error: errBody.message ?? 'Could not generate AI suggestions' };
  } catch {
    return { error: 'The AI request timed out. Please try again.' };
  }
}

export async function getLatestPendingRecommendation(
  accessToken: string,
  goalId: string,
): Promise<AIRecommendationResponse | null> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/goals/${goalId}/ai/task-suggestions`, {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body: PaginatedResponse<AIRecommendationResponse> = await res.json();
    return body.data.find((recommendation) => recommendation.status === 'PENDING') ?? null;
  } catch {
    return null;
  }
}

export async function acceptRecommendation(
  accessToken: string,
  id: string,
  acceptedIndices: number[],
): Promise<AcceptRecommendationResponse | { error: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/ai/recommendations/${id}/accept`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify({ acceptedIndices }),
    });
    if (res.ok) return res.json();
    const errBody = await res.json().catch(() => ({}));
    return { error: errBody.message ?? 'Could not accept AI suggestions' };
  } catch {
    return { error: 'Request timed out. Please try again.' };
  }
}

export async function dismissRecommendation(accessToken: string, id: string): Promise<void> {
  await fetchWithTimeout(`${baseUrl}/ai/recommendations/${id}/dismiss`, {
    method: 'POST',
    headers: authHeaders(accessToken),
  }).catch(() => undefined);
}
