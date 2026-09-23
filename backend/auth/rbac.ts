import { APIGatewayProxyEvent } from 'aws-lambda';

export type Role = 'admin' | 'operator' | 'viewer';

export interface AuthContext {
  userId: string;
  role: Role;
  username: string;
}

export const ROLE_PERMISSIONS: Record<Role, Set<string>> = {
  admin: new Set([
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'report:read',
    'report:create',
    'report:update',
    'report:delete',
    'reminder:read',
    'reminder:create',
    'reminder:update',
    'reminder:delete',
    'detection:read',
    'detection:create',
    'detection:update',
    'detection:delete',
    'email:read',
    'email:create',
    'email:update',
    'email:delete',
    'bulk:import',
    'audit:read',
  ]),
  operator: new Set([
    'user:read',
    'user:create',
    'user:update',
    'report:read',
    'report:create',
    'report:update',
    'reminder:read',
    'reminder:create',
    'reminder:update',
    'detection:read',
    'detection:create',
    'detection:update',
    'email:read',
    'email:create',
    'bulk:import',
    'audit:read',
  ]),
  viewer: new Set([
    'user:read',
    'report:read',
    'reminder:read',
    'detection:read',
    'email:read',
    'audit:read',
  ]),
};

export function extractAuthContext(event: APIGatewayProxyEvent): AuthContext {
  const authHeader = event.headers['Authorization'] || event.headers['authorization'] || '';
  const match = authHeader.match(/Bearer\s+(.+)/);
  const token = match ? match[1] : '';

  const decoded = Buffer.from(token, 'base64').toString('utf-8');
  const [userId, role, username] = decoded.split(':');

  return {
    userId: userId || 'unknown',
    role: (role as Role) || 'viewer',
    username: username || 'unknown',
  };
}

export function hasPermission(auth: AuthContext, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[auth.role];
  return permissions.has(permission);
}

export function requirePermission(auth: AuthContext, permission: string): void {
  if (!hasPermission(auth, permission)) {
    throw new ForbiddenError(`Permission denied: ${permission}`);
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}