export type ExecutionEventType =
  | 'TASK_STARTED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_COMPLETED'
  | 'TASK_ARCHIVED'
  | 'GOAL_STATUS_CHANGED';

export interface ExecutionEventResponse {
  id: string;
  ownerId: string;
  goalId: string | null;
  taskId: string | null;
  eventType: ExecutionEventType;
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: string;
}

export interface TaskExecutionSessionResponse {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
}

export interface ActiveExecutionResponse {
  session: TaskExecutionSessionResponse;
  taskTitle: string;
  goalId: string;
  goalTitle: string;
}

export interface ListExecutionEventsQuery {
  page?: number;
  pageSize?: number;
}

// Event names + payloads shared between @pee/planning (emitter) and
// @pee/execution (listener) so neither module needs to import the other.
export const TASK_STATUS_CHANGED_EVENT = 'task.status_changed';
export const GOAL_STATUS_CHANGED_EVENT = 'goal.status_changed';

export interface TaskStatusChangedEvent {
  ownerId: string;
  taskId: string;
  goalId: string;
  fromStatus: string | null;
  toStatus: string;
}

export interface GoalStatusChangedEvent {
  ownerId: string;
  goalId: string;
  projectId: string;
  fromStatus: string;
  toStatus: string;
}
