import { RequestContext } from '../src/request-context';
import { StructuredLogger } from '../src/structured-logger.service';

describe('StructuredLogger', () => {
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('emits a single JSON line with level, timestamp, and message', () => {
    new StructuredLogger().log('hello', 'TestContext');

    expect(logSpy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(logSpy.mock.calls[0][0]);
    expect(line).toMatchObject({ level: 'log', message: 'hello', context: 'TestContext' });
    expect(typeof line.timestamp).toBe('string');
    expect(new Date(line.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('stamps requestId and userId from the active RequestContext', () => {
    RequestContext.run({ requestId: 'req-1' }, () => {
      RequestContext.setUserId('user-1');
      new StructuredLogger().log('inside context');
    });

    const line = JSON.parse(logSpy.mock.calls[0][0]);
    expect(line).toMatchObject({ requestId: 'req-1', userId: 'user-1' });
  });

  it('omits requestId/userId entirely when no RequestContext is active', () => {
    new StructuredLogger().log('outside context');

    const line = JSON.parse(logSpy.mock.calls[0][0]);
    expect(line.requestId).toBeUndefined();
    expect(line.userId).toBeUndefined();
  });

  it('routes error() to console.error and includes the trace', () => {
    new StructuredLogger().error('boom', 'stack-trace-here');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(line).toMatchObject({ level: 'error', message: 'boom', trace: 'stack-trace-here' });
  });
});
