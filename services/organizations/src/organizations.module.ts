import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembershipManagementService } from './membership-management.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  controllers: [OrganizationsController, MembersController],
  providers: [OrganizationsService, MembershipManagementService],
  exports: [OrganizationsService, MembershipManagementService],
})
export class OrganizationsModule {}
