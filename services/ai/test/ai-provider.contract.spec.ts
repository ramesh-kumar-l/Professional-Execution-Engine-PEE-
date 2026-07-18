const mockAnthropicCreate = jest.fn();
const mockOpenAICreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic: any = jest.fn().mockImplementation(() => ({ messages: { create: mockAnthropicCreate } }));
  return { __esModule: true, default: MockAnthropic };
});

jest.mock('openai', () => {
  const MockOpenAI: any = jest.fn().mockImplementation(() => ({ chat: { completions: { create: mockOpenAICreate } } }));
  return { __esModule: true, default: MockOpenAI };
});

import { AnthropicProvider } from '../src/provider/anthropic.provider';
import { AIProvider } from '../src/provider/ai-provider.interface';
import { OpenAIProvider } from '../src/provider/openai.provider';

/**
 * Runs the same behavioral contract against both AIProvider implementations. This is what
 * "multi-provider safe" actually gets verified by — not just asserted in prose — proving the
 * abstraction in adr/0006 genuinely generalizes rather than leaking Anthropic-specific shape.
 */
function simulateAbortableHang(mockFn: jest.Mock): void {
  mockFn.mockImplementation(
    (_body: unknown, options: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      }),
  );
}

describe('AIProvider contract', () => {
  const cases: Array<{
    name: 'anthropic' | 'openai';
    build: (timeoutMs: number) => AIProvider;
    resolveWith: (text: string) => void;
    simulateHang: () => void;
  }> = [
    {
      name: 'anthropic',
      build: (timeoutMs) => new AnthropicProvider('key', 'claude-sonnet-5', timeoutMs),
      resolveWith: (text) =>
        mockAnthropicCreate.mockResolvedValue({
          content: [{ type: 'text', text }],
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
      simulateHang: () => simulateAbortableHang(mockAnthropicCreate),
    },
    {
      name: 'openai',
      build: (timeoutMs) => new OpenAIProvider('key', 'gpt-4o-mini', timeoutMs),
      resolveWith: (text) =>
        mockOpenAICreate.mockResolvedValue({
          choices: [{ message: { content: text } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
      simulateHang: () => simulateAbortableHang(mockOpenAICreate),
    },
  ];

  beforeEach(() => {
    mockAnthropicCreate.mockReset();
    mockOpenAICreate.mockReset();
  });

  for (const { name, build, resolveWith } of cases) {
    it(`${name}: satisfies the common request/response shape`, async () => {
      resolveWith('hello');
      const provider = build(5000);

      const result = await provider.complete({ userPrompt: 'hi' });

      expect(result.provider).toBe(name);
      expect(typeof result.model).toBe('string');
      expect(result.text).toBe('hello');
      expect(result.usage).toEqual({ inputTokens: 1, outputTokens: 1 });
    });
  }

  for (const { name, build, simulateHang } of cases) {
    it(`${name}: a hung vendor call is aborted after the timeout, never left hanging indefinitely`, async () => {
      simulateHang();
      const provider = build(20);

      await expect(provider.complete({ userPrompt: 'hi' })).rejects.toMatchObject({ reason: 'TIMEOUT' });
    });
  }
});
