import type { NextFunction, Request, Response } from 'express';
import type { AdminRole } from '@ilangathir/shared';
import { getSupabaseAdmin } from '../config/supabase.js';

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
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
    const supabase = getSupabaseAdmin();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
      return;
    }

    const { data: adminRecord, error: roleError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (roleError || !adminRecord || !adminRecord.is_active) {
      res.status(403).json({ error: 'Account is not authorized for admin portal access.' });
      return;
    }

    req.admin = {
      id: adminRecord.id,
      email: adminRecord.email,
      full_name: adminRecord.full_name,
      role: adminRecord.role as AdminRole
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
