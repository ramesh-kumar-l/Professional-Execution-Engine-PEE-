import { Injectable } from '@nestjs/common';
import { AuthEventType, PrismaService } from '@pee/database';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(eventType: AuthEventType, userId: string | null, meta: RequestMeta = {}): Promise<void> {
    await this.prisma.authAuditLog.create({
      data: {
        eventType,
        userId: userId ?? undefined,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
  }
}
