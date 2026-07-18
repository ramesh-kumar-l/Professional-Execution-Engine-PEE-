import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RequestContext } from './request-context';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * First middleware in the chain (registered in AppModule): honors an inbound
 * x-request-id (useful when a caller/gateway already assigns one) or mints a new
 * one, echoes it back on the response, and runs the rest of the request inside
 * RequestContext so every log line downstream can be correlated to this request.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: (error?: Error) => void): void {
    const requestId = (req.headers[REQUEST_ID_HEADER] as string | undefined) || randomUUID();
    res.setHeader(REQUEST_ID_HEADER, requestId);
    RequestContext.run({ requestId }, () => next());
  }
}
