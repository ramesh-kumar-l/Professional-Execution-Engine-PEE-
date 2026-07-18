import OpenAI from 'openai';
import { AICompletionRequest, AICompletionResult } from '@pee/types';
import { AIProvider } from './ai-provider.interface';
import { AIProviderError, createTimeoutController } from './ai-provider.errors';

export class OpenAIProvider implements AIProvider {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
    private readonly timeoutMs: number,
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    const { signal, clear } = createTimeoutController(this.timeoutMs);
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }
      messages.push({ role: 'user', content: request.userPrompt });

      const response = await this.client.chat.completions.create(
        {
          model: this.model,
          messages,
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          ...(request.responseSchema
            ? {
                response_format: {
                  type: 'json_schema' as const,
                  json_schema: { name: 'structured_response', schema: request.responseSchema, strict: true },
                },
              }
            : {}),
        },
        { signal },
      );

      const content = response.choices[0]?.message?.content ?? '';
      const usage = response.usage
        ? { inputTokens: response.usage.prompt_tokens, outputTokens: response.usage.completion_tokens }
        : undefined;

      if (request.responseSchema) {
        try {
          return { text: content, structured: JSON.parse(content), provider: 'openai', model: this.model, usage };
        } catch (parseErr) {
          throw new AIProviderError(
            'OpenAI response was not valid JSON matching the requested schema',
            'INVALID_RESPONSE',
            parseErr,
          );
        }
      }

      return { text: content, provider: 'openai', model: this.model, usage };
    } catch (err) {
      throw this.mapError(err);
    } finally {
      clear();
    }
  }

  private mapError(err: unknown): AIProviderError {
    if (err instanceof AIProviderError) return err;
    if (err instanceof Error && err.name === 'AbortError') {
      return new AIProviderError('OpenAI request timed out', 'TIMEOUT', err);
    }
    if (err instanceof OpenAI.APIError) {
      if (err.status === 429) {
        return new AIProviderError('OpenAI rate limit exceeded', 'RATE_LIMITED', err);
      }
      return new AIProviderError(`OpenAI API error: ${err.message}`, 'NETWORK', err);
    }
    return new AIProviderError('OpenAI request failed', 'UNKNOWN', err);
  }
}
