import type {
  AcceptRecommendationResponse,
  AIRecommendationResponse,
  PaginatedResponse,
} from '@pee/types';
import { authHeaders, baseUrl } from './api-client';

export async function generateTaskSuggestions(
  accessToken: string,
  goalId: string,
): Promise<AIRecommendationResponse | { error: string }> {
  const res = await fetch(`${baseUrl}/goals/${goalId}/ai/task-suggestions`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({}),
  });
  if (res.status === 201) return res.json();
  const errBody = await res.json().catch(() => ({}));
  return { error: errBody.message ?? 'Could not generate AI suggestions' };
}

export async function getLatestPendingRecommendation(
  accessToken: string,
  goalId: string,
): Promise<AIRecommendationResponse | null> {
  const res = await fetch(`${baseUrl}/goals/${goalId}/ai/task-suggestions`, {
    headers: authHeaders(accessToken),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const body: PaginatedResponse<AIRecommendationResponse> = await res.json();
  return body.data.find((recommendation) => recommendation.status === 'PENDING') ?? null;
}

export async function acceptRecommendation(
  accessToken: string,
  id: string,
  acceptedIndices: number[],
): Promise<AcceptRecommendationResponse | { error: string }> {
  const res = await fetch(`${baseUrl}/ai/recommendations/${id}/accept`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ acceptedIndices }),
  });
  if (res.ok) return res.json();
  const errBody = await res.json().catch(() => ({}));
  return { error: errBody.message ?? 'Could not accept AI suggestions' };
}

export async function dismissRecommendation(accessToken: string, id: string): Promise<void> {
  await fetch(`${baseUrl}/ai/recommendations/${id}/dismiss`, {
    method: 'POST',
    headers: authHeaders(accessToken),
  }).catch(() => undefined);
}
