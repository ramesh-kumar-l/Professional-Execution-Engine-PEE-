import { IsEnum } from 'class-validator';
import { MembershipRole } from '@pee/types';

const MEMBERSHIP_ROLES: MembershipRole[] = ['OWNER', 'ADMIN', 'MEMBER'];

export class UpdateMemberRoleDto {
  @IsEnum(MEMBERSHIP_ROLES)
  role!: MembershipRole;
}
