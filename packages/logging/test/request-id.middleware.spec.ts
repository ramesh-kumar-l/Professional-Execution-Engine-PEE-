import { RequestContext } from '../src/request-context';
import { RequestIdMiddleware } from '../src/request-id.middleware';

function mockRes() {
  const headers: Record<string, string> = {};
  return { setHeader: (name: string, value: string) => (headers[name] = value), headers };
}

describe('RequestIdMiddleware', () => {
  it('mints a new request id when none is supplied and echoes it on the response', () => {
    const middleware = new RequestIdMiddleware();
    const req = { headers: {} };
    const res = mockRes();
    let observed: string | undefined;

    middleware.use(req, res, () => {
      observed = RequestContext.get()?.requestId;
    });

    expect(observed).toBeDefined();
    expect(res.headers['x-request-id']).toBe(observed);
  });

  it('honors an inbound x-request-id instead of generating a new one', () => {
    const middleware = new RequestIdMiddleware();
    const req = { headers: { 'x-request-id': 'caller-supplied-id' } };
    const res = mockRes();
    let observed: string | undefined;

    middleware.use(req, res, () => {
      observed = RequestContext.get()?.requestId;
    });

    expect(observed).toBe('caller-supplied-id');
    expect(res.headers['x-request-id']).toBe('caller-supplied-id');
  });

  it('isolates context between two concurrent-ish requests', () => {
    const middleware = new RequestIdMiddleware();
    const seen: string[] = [];

    middleware.use({ headers: { 'x-request-id': 'a' } }, mockRes(), () => seen.push(RequestContext.get()!.requestId));
    middleware.use({ headers: { 'x-request-id': 'b' } }, mockRes(), () => seen.push(RequestContext.get()!.requestId));

    expect(seen).toEqual(['a', 'b']);
  });
});
