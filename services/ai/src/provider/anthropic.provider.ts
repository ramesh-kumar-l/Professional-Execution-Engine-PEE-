import Anthropic from '@anthropic-ai/sdk';
import { AICompletionRequest, AICompletionResult } from '@pee/types';
import { AIProvider } from './ai-provider.interface';
import { AIProviderError, createTimeoutController } from './ai-provider.errors';

const STRUCTURED_TOOL_NAME = 'submit_structured_response';

export class AnthropicProvider implements AIProvider {
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
    private readonly timeoutMs: number,
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    const { signal, clear } = createTimeoutController(this.timeoutMs);
    try {
      const response = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: request.maxTokens ?? 1024,
          temperature: request.temperature,
          system: request.systemPrompt,
          messages: [{ role: 'user', content: request.userPrompt }],
          ...(request.responseSchema
            ? {
                tools: [
                  {
                    name: STRUCTURED_TOOL_NAME,
                    description: 'Submit the structured response matching the required schema.',
                    input_schema: request.responseSchema as unknown as Anthropic.Tool.InputSchema,
                  },
                ],
                tool_choice: { type: 'tool' as const, name: STRUCTURED_TOOL_NAME },
              }
            : {}),
        },
        { signal },
      );

      const usage = response.usage
        ? { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens }
        : undefined;

      if (request.responseSchema) {
        const toolUse = response.content.find(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
        );
        if (!toolUse) {
          throw new AIProviderError(
            'Anthropic response did not include the expected structured tool call',
            'INVALID_RESPONSE',
          );
        }
        return { text: '', structured: toolUse.input, provider: 'anthropic', model: this.model, usage };
      }

      const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text');
      return {
        text: textBlock?.text ?? '',
        provider: 'anthropic',
        model: this.model,
        usage,
      };
    } catch (err) {
      throw this.mapError(err);
    } finally {
      clear();
    }
  }

  private mapError(err: unknown): AIProviderError {
    if (err instanceof AIProviderError) return err;
    if (err instanceof Error && err.name === 'AbortError') {
      return new AIProviderError('Anthropic request timed out', 'TIMEOUT', err);
    }
    if (err instanceof Anthropic.APIError) {
      if (err.status === 429) {
        return new AIProviderError('Anthropic rate limit exceeded', 'RATE_LIMITED', err);
      }
      return new AIProviderError(`Anthropic API error: ${err.message}`, 'NETWORK', err);
    }
    return new AIProviderError('Anthropic request failed', 'UNKNOWN', err);
  }
}
