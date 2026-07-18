import { SetMetadata } from '@nestjs/common';
import { MembershipRole } from '@pee/types';

export const REQUIRE_ROLE_KEY = 'requireRole';

/** Route-handler metadata read by OrganizationRolesGuard; the `:id` param is the organizationId. */
export const RequireRole = (role: MembershipRole) => SetMetadata(REQUIRE_ROLE_KEY, role);
