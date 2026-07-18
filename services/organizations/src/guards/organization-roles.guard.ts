import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CurrentUserPayload } from '@pee/auth';
import { MembershipRole } from '@pee/types';
import { REQUIRE_ROLE_KEY } from '../decorators/require-role.decorator';
import { OrganizationsService } from '../organizations.service';

/**
 * Reads `@RequireRole()` metadata and resolves the target organization from the
 * route's `:id` param. Routes with no `@RequireRole()` decorator pass through —
 * their service method is expected to enforce at least MEMBER access itself
 * (same "service enforces, guard is the stricter opt-in" split used for
 * destructive actions elsewhere). See adr/0009.
 */
@Injectable()
export class OrganizationRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.get<MembershipRole | undefined>(REQUIRE_ROLE_KEY, context.getHandler());
    if (!requiredRole) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;
    const organizationId = request.params.id as string;
    await this.organizationsService.assertRole(user.id, organizationId, requiredRole);
    return true;
  }
}
