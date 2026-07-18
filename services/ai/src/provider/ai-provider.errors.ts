export type AIProviderErrorReason = 'TIMEOUT' | 'NETWORK' | 'RATE_LIMITED' | 'INVALID_RESPONSE' | 'UNKNOWN';

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly reason: AIProviderErrorReason,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

/**
 * Aborts the underlying vendor SDK request (via AbortSignal) after `ms`, rather than just
 * racing a promise — a hung vendor call must not keep consuming a connection indefinitely.
 */
export function createTimeoutController(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}
