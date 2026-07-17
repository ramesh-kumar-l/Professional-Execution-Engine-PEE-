export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export interface CreateGoalRequest {
  title: string;
  description?: string;
  targetDate?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  targetDate?: string;
  status?: GoalStatus;
}

export interface GoalProgress {
  totalTasks: number;
  doneTasks: number;
  percentComplete: number;
}

export interface GoalResponse {
  id: string;
  projectId: string;
  ownerId: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  targetDate: string | null;
  completedAt: string | null;
  progress: GoalProgress;
  createdAt: string;
  updatedAt: string;
}

export interface ListGoalsQuery {
  page?: number;
  pageSize?: number;
  status?: GoalStatus;
  search?: string;
}
