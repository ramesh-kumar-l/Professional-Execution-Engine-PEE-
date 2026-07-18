import { AIRecommendationContext } from '@pee/types';

/** Caps prompt/token cost regardless of how large a goal's task list grows. */
const MAX_EXISTING_TASKS = 50;

export const TASK_BREAKDOWN_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          reason: { type: 'string' },
          confidence: { type: 'number' },
          alternatives: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'reason', 'confidence', 'alternatives'],
      },
    },
  },
  required: ['suggestions'],
} as const;

export function buildTaskBreakdownContext(
  goal: { title: string; description?: string | null },
  existingTaskTitles: string[],
): AIRecommendationContext {
  return {
    goalTitle: goal.title,
    goalDescription: goal.description ?? undefined,
    existingTaskTitles: existingTaskTitles.slice(0, MAX_EXISTING_TASKS),
  };
}

export function buildTaskBreakdownPrompt(
  context: AIRecommendationContext,
  maxSuggestions: number,
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt =
    'You are an execution-planning assistant. Given a goal, break it down into a concrete, ' +
    'actionable list of tasks. For every suggested task, state your reasoning, a confidence ' +
    'score between 0 and 1, and at least one alternative approach the user could take instead. ' +
    'Never assume a suggestion is final — the user reviews and chooses which to accept.';

  const existingSection = context.existingTaskTitles.length
    ? `Existing tasks already under this goal (avoid duplicating these):\n${context.existingTaskTitles
        .map((title) => `- ${title}`)
        .join('\n')}`
    : 'No tasks exist under this goal yet.';

  const userPrompt =
    `Goal: ${context.goalTitle}\n` +
    (context.goalDescription ? `Description: ${context.goalDescription}\n` : '') +
    `${existingSection}\n\n` +
    `Suggest up to ${maxSuggestions} tasks to accomplish this goal.`;

  return { systemPrompt, userPrompt };
}
