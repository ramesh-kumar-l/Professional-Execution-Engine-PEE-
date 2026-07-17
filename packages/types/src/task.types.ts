export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  order?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  order?: number;
}

export interface TaskResponse {
  id: string;
  goalId: string;
  ownerId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  order: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListTasksQuery {
  page?: number;
  pageSize?: number;
  status?: TaskStatus;
}
