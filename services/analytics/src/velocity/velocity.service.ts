import { Injectable } from '@nestjs/common';
import { PrismaService } from '@pee/database';
import { AnalyticsVelocityResponse } from '@pee/types';

@Injectable()
export class VelocityService {
  constructor(private readonly prisma: PrismaService) {}

  /** Buckets task/goal completions per UTC day over the trailing `days` window, ending today. */
  async getVelocity(ownerId: string, days: number): Promise<AnalyticsVelocityResponse> {
    const since = this.startOfUtcDay(new Date());
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const events = await this.prisma.executionEvent.findMany({
      where: {
        ownerId,
        createdAt: { gte: since },
        OR: [{ eventType: 'TASK_COMPLETED' }, { eventType: 'GOAL_STATUS_CHANGED', toStatus: 'COMPLETED' }],
      },
      select: { eventType: true, createdAt: true },
    });

    const buckets = new Map<string, { tasksCompleted: number; goalsCompleted: number }>();
    for (let i = 0; i < days; i++) {
      const date = new Date(since);
      date.setUTCDate(since.getUTCDate() + i);
      buckets.set(this.toDateKey(date), { tasksCompleted: 0, goalsCompleted: 0 });
    }

    for (const event of events) {
      const bucket = buckets.get(this.toDateKey(event.createdAt));
      if (!bucket) continue;
      if (event.eventType === 'TASK_COMPLETED') bucket.tasksCompleted += 1;
      else bucket.goalsCompleted += 1;
    }

    return {
      days,
      points: [...buckets.entries()].map(([date, counts]) => ({ date, ...counts })),
    };
  }

  private startOfUtcDay(date: Date): Date {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
