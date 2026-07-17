import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload, JwtAuthGuard } from '@pee/auth';
import { PaginatedResponse, ProjectResponse } from '@pee/types';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateProjectDto): Promise<ProjectResponse> {
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListProjectsQueryDto,
  ): Promise<PaginatedResponse<ProjectResponse>> {
    return this.projectsService.list(user.id, query);
  }

  @Get(':id')
  getOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string): Promise<ProjectResponse> {
    return this.projectsService.getOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  archive(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string): Promise<void> {
    return this.projectsService.archive(user.id, id);
  }
}
