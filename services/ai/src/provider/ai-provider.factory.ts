import { ConfigService } from '@nestjs/config';
import { AIProvider } from './ai-provider.interface';
import { AnthropicProvider } from './anthropic.provider';
import { OpenAIProvider } from './openai.provider';

const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * Constructs only the active provider — the inactive vendor's API key is never required at
 * boot. Throws synchronously if the active provider's key is missing: AI is a first-class
 * capability (Principle 3), so a misconfigured deployment should fail fast at startup, not
 * silently no-op on the first user request.
 */
export function createAIProvider(config: ConfigService): AIProvider {
  const providerName = (config.get<string>('AI_PROVIDER') ?? 'anthropic').toLowerCase();

  if (providerName === 'anthropic') {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('AI_PROVIDER=anthropic requires ANTHROPIC_API_KEY to be set');
    }
    const model = config.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-5';
    return new AnthropicProvider(apiKey, model, DEFAULT_TIMEOUT_MS);
  }

  if (providerName === 'openai') {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('AI_PROVIDER=openai requires OPENAI_API_KEY to be set');
    }
    const model = config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    return new OpenAIProvider(apiKey, model, DEFAULT_TIMEOUT_MS);
  }

  throw new Error(`Unknown AI_PROVIDER "${providerName}" — expected "anthropic" or "openai"`);
}
