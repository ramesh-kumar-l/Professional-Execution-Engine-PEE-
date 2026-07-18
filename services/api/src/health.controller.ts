import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '@pee/database';

/**
 * A real readiness check: orchestrators (or a load balancer) need to know when an
 * instance can actually serve traffic, not just that the Node process is alive. Pings
 * Postgres on every call and fails closed if it's unreachable.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: 'ok'; database: 'ok' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'unreachable' });
    }
    return { status: 'ok', database: 'ok' };
  }
}
