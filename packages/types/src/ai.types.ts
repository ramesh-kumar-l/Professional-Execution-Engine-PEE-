import type { TaskResponse } from './task.types';

export type AIProviderName = 'anthropic' | 'openai';

export interface AICompletionRequest {
  systemPrompt?: string;
  userPrompt: string;
  responseSchema?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResult {
  text: string;
  structured?: unknown;
  provider: AIProviderName;
  model: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export type AIRecommendationType = 'GOAL_TASK_BREAKDOWN';
export type AIRecommendationStatus = 'PENDING' | 'ACCEPTED' | 'DISMISSED' | 'FAILED';

export interface AITaskSuggestion {
  title: string;
  description?: string;
  reason: string;
  confidence: number;
  alternatives: string[];
}

export interface AIRecommendationContext {
  goalTitle: string;
  goalDescription?: string;
  existingTaskTitles: string[];
}

export interface AIRecommendationResponse {
  id: string;
  goalId: string;
  type: AIRecommendationType;
  status: AIRecommendationStatus;
  suggestions: AITaskSuggestion[];
  context: AIRecommendationContext;
  provider: AIProviderName;
  model: string;
  createdAt: string;
  respondedAt?: string | null;
}

export interface GenerateTaskSuggestionsRequest {
  maxSuggestions?: number;
}

export interface AcceptRecommendationRequest {
  acceptedIndices: number[];
}

export interface AcceptRecommendationResponse {
  recommendation: AIRecommendationResponse;
  createdTasks: TaskResponse[];
}
