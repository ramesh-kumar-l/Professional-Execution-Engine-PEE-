export type MembershipRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface CreateOrganizationRequest {
  name: string;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  isPersonal: boolean;
  role: MembershipRole;
  createdAt: string;
  updatedAt: string;
}

export interface MemberResponse {
  userId: string;
  email: string;
  displayName: string;
  role: MembershipRole;
  createdAt: string;
}

export interface InviteMemberRequest {
  email: string;
  role?: MembershipRole;
}

export interface UpdateMemberRoleRequest {
  role: MembershipRole;
}
