import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextData {
  requestId: string;
  userId?: string;
}

/**
 * Carries the request id (and user id, once auth resolves it) across the whole async
 * call chain of a single request, so StructuredLogger can stamp every log line with
 * both without threading them through every function signature.
 */
export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<RequestContextData>();

  static run<T>(data: RequestContextData, fn: () => T): T {
    return this.storage.run(data, fn);
  }

  static get(): RequestContextData | undefined {
    return this.storage.getStore();
  }

  static setUserId(userId: string): void {
    const current = this.storage.getStore();
    if (current) current.userId = userId;
  }
}
