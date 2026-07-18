import { Injectable } from '@nestjs/common';
import { PrismaService } from '@pee/database';
import { AnalyticsSummaryResponse } from '@pee/types';

type CountRow = { status: string; _count: number };

@Injectable()
export class SummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(ownerId: string): Promise<AnalyticsSummaryResponse> {
    const [projects, goals, tasks, timeTracked, aiRecommendations] = await Promise.all([
      this.prisma.project.groupBy({ by: ['status'], where: { ownerId }, _count: true }),
      this.prisma.goal.groupBy({ by: ['status'], where: { ownerId }, _count: true }),
      this.prisma.task.groupBy({ by: ['status'], where: { ownerId }, _count: true }),
      this.prisma.taskExecutionSession.aggregate({
        where: { ownerId, endedAt: { not: null } },
        _sum: { durationSeconds: true },
      }),
      this.prisma.aIRecommendation.groupBy({ by: ['status'], where: { ownerId }, _count: true }),
    ]);

    const aiByStatus = this.toCountMap(aiRecommendations);
    const accepted = aiByStatus.ACCEPTED ?? 0;
    const dismissed = aiByStatus.DISMISSED ?? 0;
    const responded = accepted + dismissed;

    return {
      projectsByStatus: this.toCountMap(projects),
      goalsByStatus: this.toCountMap(goals),
      tasksByStatus: this.toCountMap(tasks),
      totalTimeTrackedSeconds: timeTracked._sum.durationSeconds ?? 0,
      aiRecommendations: {
        byStatus: aiByStatus,
        acceptanceRate: responded === 0 ? null : accepted / responded,
      },
    };
  }

  private toCountMap(rows: CountRow[]): Record<string, number> {
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count;
      return acc;
    }, {});
  }
}
