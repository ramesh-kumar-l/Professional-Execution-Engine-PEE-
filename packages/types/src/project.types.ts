export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export interface CreateProjectRequest {
  name: string;
  description?: string;
  /** Omit to default to the caller's personal organization. */
  organizationId?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface ProjectResponse {
  id: string;
  ownerId: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListProjectsQuery {
  page?: number;
  pageSize?: number;
  status?: ProjectStatus;
  search?: string;
  /** Omit to list across every organization the caller belongs to. */
  organizationId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
