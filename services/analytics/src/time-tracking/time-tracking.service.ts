import { Injectable } from '@nestjs/common';
import { PrismaService } from '@pee/database';
import { AnalyticsGroupBy, AnalyticsTimeTrackingResponse } from '@pee/types';

@Injectable()
export class TimeTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Sums completed-session durations grouped by goal or project, over the trailing `sinceDays` window. */
  async getTimeTracking(
    ownerId: string,
    groupBy: AnalyticsGroupBy,
    sinceDays: number,
  ): Promise<AnalyticsTimeTrackingResponse> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - sinceDays);

    const sessions = await this.prisma.taskExecutionSession.findMany({
      where: { ownerId, endedAt: { not: null }, startedAt: { gte: since } },
      select: {
        durationSeconds: true,
        task: {
          select: {
            goalId: true,
            goal: { select: { title: true, projectId: true, project: { select: { name: true } } } },
          },
        },
      },
    });

    const totals = new Map<string, { title: string; totalSeconds: number }>();
    for (const session of sessions) {
      const seconds = session.durationSeconds ?? 0;
      const id = groupBy === 'goal' ? session.task.goalId : session.task.goal.projectId;
      const title = groupBy === 'goal' ? session.task.goal.title : session.task.goal.project.name;
      const existing = totals.get(id);
      if (existing) existing.totalSeconds += seconds;
      else totals.set(id, { title, totalSeconds: seconds });
    }

    return {
      groupBy,
      entries: [...totals.entries()]
        .map(([id, value]) => ({ id, title: value.title, totalSeconds: value.totalSeconds }))
        .sort((a, b) => b.totalSeconds - a.totalSeconds),
    };
  }
}
