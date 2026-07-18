import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload, JwtAuthGuard } from '@pee/auth';
import { MemberResponse } from '@pee/types';
import { RequireRole } from './decorators/require-role.decorator';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { OrganizationRolesGuard } from './guards/organization-roles.guard';
import { MembershipManagementService } from './membership-management.service';

@UseGuards(JwtAuthGuard, OrganizationRolesGuard)
@Controller('organizations/:id/members')
export class MembersController {
  constructor(private readonly membershipManagementService: MembershipManagementService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload, @Param('id') organizationId: string): Promise<MemberResponse[]> {
    return this.membershipManagementService.listMembers(user.id, organizationId);
  }

  @Post()
  @HttpCode(201)
  @RequireRole('ADMIN')
  invite(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') organizationId: string,
    @Body() dto: InviteMemberDto,
  ): Promise<MemberResponse> {
    return this.membershipManagementService.inviteMember(user.id, organizationId, dto);
  }

  @Patch(':userId')
  @RequireRole('ADMIN')
  updateRole(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') organizationId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<MemberResponse> {
    return this.membershipManagementService.updateMemberRole(user.id, organizationId, targetUserId, dto);
  }

  @Delete(':userId')
  @HttpCode(204)
  @RequireRole('ADMIN')
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') organizationId: string,
    @Param('userId') targetUserId: string,
  ): Promise<void> {
    return this.membershipManagementService.removeMember(user.id, organizationId, targetUserId);
  }
}
