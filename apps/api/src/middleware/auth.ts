import type { NextFunction, Request, Response } from 'express';
import type { AdminRole } from '@ilangathir/shared';
import { isServiceRoleKeyLikelyValid } from '../config/env.js';
import { getSupabaseAdmin } from '../config/supabase.js';
import { verifyAndSyncAdminSession } from '../services/device.js';

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  sessionId?: string;
  deviceId?: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthenticatedAdmin;
    }
  }
}

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: 'Invalid authentication token.' });
    return;
  }

  try {
    if (!isServiceRoleKeyLikelyValid()) {
      res.status(503).json({
        error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY in ilangathir-api is invalid (not a service_role key). Update it in Vercel and redeploy.',
        code: 'INVALID_SERVICE_ROLE_KEY'
      });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      res.status(401).json({ error: 'Session expired or invalid. Please sign in again.', code: 'INVALID_TOKEN' });
      return;
    }

    const { data: adminRecord, error: roleError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (roleError) {
      console.error('[Auth] Failed querying admin_users:', roleError.code, roleError.message);
      res.status(403).json({
        error: `Admin role check failed (${roleError.code || 'db_error'}). Verify SUPABASE_SERVICE_ROLE_KEY and v009 grants.`
      });
      return;
    }

    if (!adminRecord) {
      res.status(403).json({
        error: 'Signed-in user is not registered in public.admin_users.'
      });
      return;
    }

    if (!adminRecord.is_active) {
      res.status(403).json({ error: 'Admin account is deactivated.' });
      return;
    }

    const sessionCheck = await verifyAndSyncAdminSession({
      req,
      userId: adminRecord.id,
      email: adminRecord.email,
      token
    });

    if (!sessionCheck.allowed) {
      res.status(401).json({
        error: sessionCheck.reason || 'This session has been signed out remotely.',
        code: 'SESSION_REVOKED'
      });
      return;
    }

    req.admin = {
      id: adminRecord.id,
      email: adminRecord.email,
      full_name: adminRecord.full_name,
      role: adminRecord.role as AdminRole,
      sessionId: sessionCheck.sessionId,
      deviceId: sessionCheck.device.deviceId
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this operation.' });
      return;
    }
    next();
  };
}
