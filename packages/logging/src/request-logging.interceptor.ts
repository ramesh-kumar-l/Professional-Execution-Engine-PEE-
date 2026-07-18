import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { RequestContext } from './request-context';
import { StructuredLogger } from './structured-logger.service';

/**
 * Runs after guards (so req.user is already populated for authenticated routes) and logs
 * exactly one line per request: method, path, status, duration, and whatever RequestContext
 * has picked up (requestId, userId). Registered globally in services/api's AppModule.
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const userId = request.user?.id as string | undefined;
    if (userId) RequestContext.setUserId(userId);

    const startedAt = Date.now();
    return next.handle().pipe(
      tap({
        next: () => this.logRequest(request, response, startedAt),
        error: () => this.logRequest(request, response, startedAt),
      }),
    );
  }

  private logRequest(request: any, response: any, startedAt: number): void {
    const durationMs = Date.now() - startedAt;
    this.logger.log(
      `${request.method} ${request.originalUrl ?? request.url} ${response.statusCode} ${durationMs}ms`,
      'HTTP',
    );
  }
}
