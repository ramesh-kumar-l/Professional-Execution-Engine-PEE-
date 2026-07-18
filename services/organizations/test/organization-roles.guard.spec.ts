import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationRolesGuard } from '../src/guards/organization-roles.guard';
import { OrganizationsService } from '../src/organizations.service';

function buildContext(userId: string, organizationId: string): ExecutionContext {
  return {
    getHandler: () => jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: { id: userId }, params: { id: organizationId } }),
    }),
  } as unknown as ExecutionContext;
}

describe('OrganizationRolesGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let organizationsService: jest.Mocked<OrganizationsService>;
  let guard: OrganizationRolesGuard;

  beforeEach(() => {
    reflector = { get: jest.fn() } as unknown as jest.Mocked<Reflector>;
    organizationsService = { assertRole: jest.fn() } as unknown as jest.Mocked<OrganizationsService>;
    guard = new OrganizationRolesGuard(reflector, organizationsService);
  });

  it('passes through when the route has no @RequireRole() metadata', async () => {
    reflector.get.mockReturnValue(undefined);
    const result = await guard.canActivate(buildContext('user-1', 'org-1'));
    expect(result).toBe(true);
    expect(organizationsService.assertRole).not.toHaveBeenCalled();
  });

  it('delegates to OrganizationsService.assertRole using the :id route param as the organizationId', async () => {
    reflector.get.mockReturnValue('ADMIN');
    organizationsService.assertRole.mockResolvedValue({ organizationId: 'org-1', role: 'ADMIN' } as any);

    const result = await guard.canActivate(buildContext('user-1', 'org-1'));

    expect(organizationsService.assertRole).toHaveBeenCalledWith('user-1', 'org-1', 'ADMIN');
    expect(result).toBe(true);
  });

  it('propagates the rejection when the caller lacks the required role', async () => {
    reflector.get.mockReturnValue('ADMIN');
    organizationsService.assertRole.mockRejectedValue(new Error('insufficient role'));
    await expect(guard.canActivate(buildContext('user-1', 'org-1'))).rejects.toThrow('insufficient role');
  });
});
