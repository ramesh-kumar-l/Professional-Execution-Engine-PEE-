import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService, Project } from '@pee/database';
import { OrganizationsService } from '@pee/organizations';
import { PaginatedResponse, ProjectResponse } from '@pee/types';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  /**
   * `options` is populated only by internal callers (e.g. sync push) — never bound to the
   * public HTTP DTO, so a client can't set its own id/updatedAt through the plain REST endpoint.
   * `dto.organizationId` defaults to the caller's personal organization (Phase 10) — this is
   * why `apps/desktop`/`apps/mobile` (which never send it) keep working unchanged.
   */
  async create(
    ownerId: string,
    dto: CreateProjectDto,
    options?: { id?: string; updatedAt?: Date },
  ): Promise<ProjectResponse> {
    const organizationId = dto.organizationId
      ? (await this.organizationsService.assertRole(ownerId, dto.organizationId, 'MEMBER')).organizationId
      : await this.organizationsService.getDefaultOrganizationId(ownerId);

    const project = await this.prisma.project.create({
      data: {
        id: options?.id,
        ownerId,
        organizationId,
        name: dto.name,
        description: dto.description,
        updatedAt: options?.updatedAt,
      },
    });
    return this.toResponse(project);
  }

  /** Omitting `query.organizationId` lists across every org the caller belongs to (Phase 10). */
  async list(ownerId: string, query: ListProjectsQueryDto): Promise<PaginatedResponse<ProjectResponse>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const organizationScope = query.organizationId
      ? await this.singleOrganizationScope(ownerId, query.organizationId)
      : { in: await this.organizationsService.listOrganizationIdsForUser(ownerId) };

    const where: Prisma.ProjectWhereInput = {
      organizationId: organizationScope,
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
    const project = await this.findAccessibleOrThrow(ownerId, id);
    return this.toResponse(project);
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateProjectDto,
    options?: { updatedAt?: Date },
  ): Promise<ProjectResponse> {
    await this.findAccessibleOrThrow(ownerId, id);
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined
          ? { status: dto.status, archivedAt: dto.status === 'ARCHIVED' ? new Date() : null }
          : {}),
        ...(options?.updatedAt !== undefined ? { updatedAt: options.updatedAt } : {}),
        version: { increment: 1 },
      },
    });
    return this.toResponse(project);
  }

  /** Archiving is destructive: only the creator or an org ADMIN/OWNER may do it (Phase 10). */
  async archive(ownerId: string, id: string): Promise<void> {
    const project = await this.findAccessibleOrThrow(ownerId, id);
    await this.assertDestructivePermission(ownerId, project);
    if (project.status === 'ARCHIVED') {
      return;
    }
    await this.prisma.project.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date(), version: { increment: 1 } },
    });
  }

  /** Not-a-member stays 404 (existence-hiding); any member (MEMBER+) may read/update. See adr/0009. */
  private async findAccessibleOrThrow(userId: string, id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.organizationsService.assertRole(userId, project.organizationId, 'MEMBER');
    return project;
  }

  private async assertDestructivePermission(userId: string, project: Project): Promise<void> {
    if (project.ownerId === userId) {
      return;
    }
    await this.organizationsService.assertRole(userId, project.organizationId, 'ADMIN');
  }

  private async singleOrganizationScope(userId: string, organizationId: string): Promise<string> {
    await this.organizationsService.assertRole(userId, organizationId, 'MEMBER');
    return organizationId;
  }

  private toResponse(project: Project): ProjectResponse {
    return {
      id: project.id,
      ownerId: project.ownerId,
      organizationId: project.organizationId,
      name: project.name,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
