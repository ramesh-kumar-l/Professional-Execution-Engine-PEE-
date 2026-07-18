import { AICompletionRequest, AICompletionResult } from '@pee/types';

/** Nest DI token — no feature code should ever import a concrete provider class directly. */
export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';

/**
 * The one abstraction every AI-native feature calls through (adr/0006). Deliberately exposes
 * only `complete()` for now — `stream`/`embed` are added the moment a real feature needs them,
 * not speculatively (Principle 8, Sustainable Complexity).
 */
export interface AIProvider {
  complete(request: AICompletionRequest): Promise<AICompletionResult>;
}
