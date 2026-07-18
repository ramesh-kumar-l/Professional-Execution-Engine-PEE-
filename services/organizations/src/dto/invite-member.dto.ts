import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { MembershipRole } from '@pee/types';

const MEMBERSHIP_ROLES: MembershipRole[] = ['OWNER', 'ADMIN', 'MEMBER'];

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(MEMBERSHIP_ROLES)
  role?: MembershipRole;
}
