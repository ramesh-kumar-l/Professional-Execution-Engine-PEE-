const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => {
  class MockAPIError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.status = status;
    }
  }
  const MockAnthropic: any = jest.fn().mockImplementation(() => ({ messages: { create: mockCreate } }));
  MockAnthropic.APIError = MockAPIError;
  return { __esModule: true, default: MockAnthropic };
});

import Anthropic from '@anthropic-ai/sdk';
import { AnthropicProvider } from '../src/provider/anthropic.provider';

describe('AnthropicProvider', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns plain text when no responseSchema is given', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'hello' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });
    const provider = new AnthropicProvider('key', 'claude-sonnet-5', 5000);

    const result = await provider.complete({ userPrompt: 'hi' });

    expect(result).toEqual({
      text: 'hello',
      provider: 'anthropic',
      model: 'claude-sonnet-5',
      usage: { inputTokens: 10, outputTokens: 5 },
    });
  });

  it('forces tool-use and returns structured output when responseSchema is given', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'tool_use', input: { suggestions: [] } }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });
    const provider = new AnthropicProvider('key', 'claude-sonnet-5', 5000);

    const result = await provider.complete({ userPrompt: 'hi', responseSchema: { type: 'object' } });

    expect(result.structured).toEqual({ suggestions: [] });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ tool_choice: { type: 'tool', name: 'submit_structured_response' } }),
      expect.anything(),
    );
  });

  it('maps a missing tool_use block to an INVALID_RESPONSE error, never fabricating structured data', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'oops' }] });
    const provider = new AnthropicProvider('key', 'claude-sonnet-5', 5000);

    await expect(
      provider.complete({ userPrompt: 'hi', responseSchema: { type: 'object' } }),
    ).rejects.toMatchObject({ reason: 'INVALID_RESPONSE' });
  });

  it('maps an SDK abort error to a TIMEOUT AIProviderError', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    mockCreate.mockRejectedValue(abortError);
    const provider = new AnthropicProvider('key', 'claude-sonnet-5', 5000);

    await expect(provider.complete({ userPrompt: 'hi' })).rejects.toMatchObject({ reason: 'TIMEOUT' });
  });

  it('maps a 429 Anthropic.APIError to RATE_LIMITED', async () => {
    const ApiErrorCtor = (Anthropic as unknown as { APIError: new (message: string, status: number) => Error }).APIError;
    mockCreate.mockRejectedValue(new ApiErrorCtor('rate limited', 429));
    const provider = new AnthropicProvider('key', 'claude-sonnet-5', 5000);

    await expect(provider.complete({ userPrompt: 'hi' })).rejects.toMatchObject({ reason: 'RATE_LIMITED' });
  });

  it('maps an unrecognized thrown error to UNKNOWN, never leaking it unmapped to the caller', async () => {
    mockCreate.mockRejectedValue(new Error('something odd'));
    const provider = new AnthropicProvider('key', 'claude-sonnet-5', 5000);

    await expect(provider.complete({ userPrompt: 'hi' })).rejects.toMatchObject({ reason: 'UNKNOWN' });
  });
});
