import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService, Project } from '@pee/database';
import { PaginatedResponse, ProjectResponse } from '@pee/types';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateProjectDto): Promise<ProjectResponse> {
    const project = await this.prisma.project.create({
      data: { ownerId, name: dto.name, description: dto.description },
    });
    return this.toResponse(project);
  }

  async list(ownerId: string, query: ListProjectsQueryDto): Promise<PaginatedResponse<ProjectResponse>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.ProjectWhereInput = {
      ownerId,
      status: query.status ?? 'ACTIVE',
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: data.map((project) => this.toResponse(project)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getOne(ownerId: string, id: string): Promise<ProjectResponse> {
    const project = await this.findOwnedOrThrow(ownerId, id);
    return this.toResponse(project);
  }

  async update(ownerId: string, id: string, dto: UpdateProjectDto): Promise<ProjectResponse> {
    await this.findOwnedOrThrow(ownerId, id);
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined
          ? { status: dto.status, archivedAt: dto.status === 'ARCHIVED' ? new Date() : null }
          : {}),
      },
    });
    return this.toResponse(project);
  }

  async archive(ownerId: string, id: string): Promise<void> {
    const project = await this.findOwnedOrThrow(ownerId, id);
    if (project.status === 'ARCHIVED') {
      return;
    }
    await this.prisma.project.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
  }

  private async findOwnedOrThrow(ownerId: string, id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project || project.ownerId !== ownerId) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private toResponse(project: Project): ProjectResponse {
    return {
      id: project.id,
      ownerId: project.ownerId,
      name: project.name,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
