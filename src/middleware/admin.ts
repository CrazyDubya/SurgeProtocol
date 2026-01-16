/**
 * Surge Protocol - Admin Authentication Middleware
 *
 * Protects admin routes with either:
 * 1. CF_MASTER_TOKEN header authentication (for CI/CD and internal tools)
 * 2. JWT with admin role (for admin users)
 *
 * All admin actions are logged for audit purposes.
 */

import type { Context, Next } from 'hono';
import { verifyJWT } from './auth';

/**
 * Admin authentication middleware.
 *
 * Requires either:
 * - X-Admin-Token header matching CF_MASTER_TOKEN
 * - Valid JWT with admin role in Authorization header
 */
export function adminMiddleware() {
  return async (c: Context, next: Next) => {
    const masterToken = c.env?.CF_MASTER_TOKEN as string | undefined;
    const jwtSecret = c.env?.JWT_SECRET as string | undefined;

    // Check for admin token header
    const adminToken = c.req.header('X-Admin-Token');
    if (adminToken && masterToken && adminToken === masterToken) {
      // Token auth successful - log and continue
      await logAdminAction(c, 'token', 'system');
      return next();
    }

    // Check for JWT with admin role
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ') && jwtSecret) {
      const token = authHeader.slice(7);

      try {
        const payload = await verifyJWT(token, jwtSecret);

        if (payload && payload.type === 'access') {
          // Check if user has admin role
          const db = c.env?.DB as D1Database | undefined;
          if (db && payload.sub) {
            const user = await db
              .prepare('SELECT role FROM users WHERE id = ?')
              .bind(payload.sub)
              .first<{ role: string }>();

            if (user?.role === 'ADMIN') {
              await logAdminAction(c, 'jwt', payload.sub);
              c.set('userId', payload.sub);
              c.set('isAdmin', true);
              return next();
            }
          }
        }
      } catch {
        // JWT verification failed, continue to error response
      }
    }

    // No valid authentication
    return c.json({
      success: false,
      errors: [{
        code: 'ADMIN_AUTH_REQUIRED',
        message: 'Admin authentication required',
      }],
    }, 401);
  };
}

/**
 * Log admin action for audit trail.
 */
async function logAdminAction(
  c: Context,
  authMethod: 'token' | 'jwt',
  userId: string
): Promise<void> {
  const db = c.env?.DB as D1Database | undefined;

  if (!db) return;

  try {
    const request = c.req;
    const ip = request.header('CF-Connecting-IP')
      || request.header('X-Forwarded-For')?.split(',')[0]
      || 'unknown';

    await db
      .prepare(`
        INSERT INTO admin_audit_log (
          id, user_id, action, resource, method, path, ip_address, auth_method, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        crypto.randomUUID(),
        userId,
        getActionFromMethod(request.method),
        request.path,
        request.method,
        request.path,
        ip,
        authMethod
      )
      .run();
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to log admin action:', error);
  }
}

function getActionFromMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET': return 'READ';
    case 'POST': return 'CREATE';
    case 'PUT':
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return 'UNKNOWN';
  }
}

/**
 * Require specific admin permission.
 *
 * @param permission - Required permission (e.g., 'seed', 'cache', 'stats')
 */
export function requirePermission(permission: string) {
  return async (c: Context, next: Next) => {
    // For now, all admins have all permissions
    // Future: Check against user_permissions table
    const isAdmin = c.get('isAdmin');

    if (!isAdmin) {
      return c.json({
        success: false,
        errors: [{
          code: 'PERMISSION_DENIED',
          message: `Permission '${permission}' required`,
        }],
      }, 403);
    }

    return next();
  };
}

/**
 * Require production environment check.
 * Some operations are disabled in production.
 */
export function requireNonProduction() {
  return async (c: Context, next: Next) => {
    const environment = c.env?.ENVIRONMENT as string | undefined;

    if (environment === 'production') {
      return c.json({
        success: false,
        errors: [{
          code: 'FORBIDDEN_IN_PRODUCTION',
          message: 'This operation is disabled in production',
        }],
      }, 403);
    }

    return next();
  };
}
