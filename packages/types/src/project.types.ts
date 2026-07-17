export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface ProjectResponse {
  id: string;
  ownerId: string;
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
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
