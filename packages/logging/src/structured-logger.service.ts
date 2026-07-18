import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { RequestContext } from './request-context';

interface LogLine {
  level: LogLevel;
  timestamp: string;
  message: string;
  context?: string;
  requestId?: string;
  userId?: string;
  trace?: string;
}

/**
 * Replaces Nest's default console logger with one-JSON-object-per-line output, so log
 * aggregation (CloudWatch/Datadog/whatever the eventual platform is) can parse level,
 * timestamp, and the request/user correlation ids without a regex. See P0 hardening item:
 * "the backend currently cannot answer 'what happened' for any request."
 */
@Injectable()
export class StructuredLogger implements LoggerService {
  log(message: string, context?: string): void {
    this.write('log', message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.write('error', message, context, trace);
  }

  warn(message: string, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: string, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: string, context?: string): void {
    this.write('verbose', message, context);
  }

  private write(level: LogLevel, message: string, context?: string, trace?: string): void {
    const requestContext = RequestContext.get();
    const line: LogLine = {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...(context ? { context } : {}),
      ...(requestContext?.requestId ? { requestId: requestContext.requestId } : {}),
      ...(requestContext?.userId ? { userId: requestContext.userId } : {}),
      ...(trace ? { trace } : {}),
    };
    const stream = level === 'error' ? console.error : console.log;
    stream(JSON.stringify(line));
  }
}
