import { Request } from 'express';
import { RequestMeta } from './audit-log.service';

export function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}
