import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Marks a route with the roles allowed to call it, e.g. @Roles(Role.LIBRARIAN).
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
