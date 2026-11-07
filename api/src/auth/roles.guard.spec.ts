import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function contextFor(user?: { role: Role }): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  function routeRequires(roles?: Role[]) {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
  }

  afterEach(() => jest.restoreAllMocks());

  it('lets anyone through when the route has no @Roles()', () => {
    routeRequires(undefined);
    expect(guard.canActivate(contextFor({ role: Role.PATRON }))).toBe(true);
  });

  it('lets a LIBRARIAN through a LIBRARIAN-only route', () => {
    routeRequires([Role.LIBRARIAN]);
    expect(guard.canActivate(contextFor({ role: Role.LIBRARIAN }))).toBe(true);
  });

  it('blocks a PATRON from a LIBRARIAN-only route with 403', () => {
    routeRequires([Role.LIBRARIAN]);
    expect(() => guard.canActivate(contextFor({ role: Role.PATRON }))).toThrow(ForbiddenException);
  });

  it('blocks a request that has no user at all', () => {
    routeRequires([Role.LIBRARIAN]);
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(ForbiddenException);
  });
});
