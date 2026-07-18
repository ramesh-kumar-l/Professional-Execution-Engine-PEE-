import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload, JwtAuthGuard } from '@pee/auth';
import { OrganizationResponse } from '@pee/types';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationsService } from './organizations.service';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateOrganizationDto): Promise<OrganizationResponse> {
    return this.organizationsService.create(user.id, dto);
  }

  @Get()
  listForUser(@CurrentUser() user: CurrentUserPayload): Promise<OrganizationResponse[]> {
    return this.organizationsService.listForUser(user.id);
  }

  @Get(':id')
  getOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string): Promise<OrganizationResponse> {
    return this.organizationsService.getOne(user.id, id);
  }
}
