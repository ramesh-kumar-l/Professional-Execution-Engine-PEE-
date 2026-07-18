export interface AnalyticsSummaryResponse {
  projectsByStatus: Record<string, number>;
  goalsByStatus: Record<string, number>;
  tasksByStatus: Record<string, number>;
  totalTimeTrackedSeconds: number;
  aiRecommendations: {
    byStatus: Record<string, number>;
    acceptanceRate: number | null;
  };
}

export interface AnalyticsVelocityPoint {
  date: string;
  tasksCompleted: number;
  goalsCompleted: number;
}

export interface AnalyticsVelocityResponse {
  days: number;
  points: AnalyticsVelocityPoint[];
}

export type AnalyticsGroupBy = 'goal' | 'project';

export interface AnalyticsTimeTrackingEntry {
  id: string;
  title: string;
  totalSeconds: number;
}

export interface AnalyticsTimeTrackingResponse {
  groupBy: AnalyticsGroupBy;
  entries: AnalyticsTimeTrackingEntry[];
}
