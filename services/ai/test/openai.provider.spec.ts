const mockCreate = jest.fn();

jest.mock('openai', () => {
  class MockAPIError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.status = status;
    }
  }
  const MockOpenAI: any = jest.fn().mockImplementation(() => ({ chat: { completions: { create: mockCreate } } }));
  MockOpenAI.APIError = MockAPIError;
  return { __esModule: true, default: MockOpenAI };
});

import OpenAI from 'openai';
import { OpenAIProvider } from '../src/provider/openai.provider';

describe('OpenAIProvider', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns plain text when no responseSchema is given', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'hello' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });
    const provider = new OpenAIProvider('key', 'gpt-4o-mini', 5000);

    const result = await provider.complete({ userPrompt: 'hi' });

    expect(result).toEqual({
      text: 'hello',
      provider: 'openai',
      model: 'gpt-4o-mini',
      usage: { inputTokens: 10, outputTokens: 5 },
    });
  });

  it('requests json_schema and parses structured output when responseSchema is given', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ suggestions: [] }) } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });
    const provider = new OpenAIProvider('key', 'gpt-4o-mini', 5000);

    const result = await provider.complete({ userPrompt: 'hi', responseSchema: { type: 'object' } });

    expect(result.structured).toEqual({ suggestions: [] });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ response_format: expect.objectContaining({ type: 'json_schema' }) }),
      expect.anything(),
    );
  });

  it('maps unparseable structured output to an INVALID_RESPONSE error, never fabricating structured data', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'not json' } }] });
    const provider = new OpenAIProvider('key', 'gpt-4o-mini', 5000);

    await expect(
      provider.complete({ userPrompt: 'hi', responseSchema: { type: 'object' } }),
    ).rejects.toMatchObject({ reason: 'INVALID_RESPONSE' });
  });

  it('maps an SDK abort error to a TIMEOUT AIProviderError', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    mockCreate.mockRejectedValue(abortError);
    const provider = new OpenAIProvider('key', 'gpt-4o-mini', 5000);

    await expect(provider.complete({ userPrompt: 'hi' })).rejects.toMatchObject({ reason: 'TIMEOUT' });
  });

  it('maps a 429 OpenAI.APIError to RATE_LIMITED', async () => {
    const ApiErrorCtor = (OpenAI as unknown as { APIError: new (message: string, status: number) => Error }).APIError;
    mockCreate.mockRejectedValue(new ApiErrorCtor('rate limited', 429));
    const provider = new OpenAIProvider('key', 'gpt-4o-mini', 5000);

    await expect(provider.complete({ userPrompt: 'hi' })).rejects.toMatchObject({ reason: 'RATE_LIMITED' });
  });

  it('maps an unrecognized thrown error to UNKNOWN, never leaking it unmapped to the caller', async () => {
    mockCreate.mockRejectedValue(new Error('something odd'));
    const provider = new OpenAIProvider('key', 'gpt-4o-mini', 5000);

    await expect(provider.complete({ userPrompt: 'hi' })).rejects.toMatchObject({ reason: 'UNKNOWN' });
  });
});
