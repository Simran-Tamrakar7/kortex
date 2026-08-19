import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { Role } from '@kortex/shared';

export const JWT_SECRET = process.env.JWT_SECRET || 'kortex_super_secret_jwt_key_2026';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'kortex_super_secret_refresh_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role?: Role;
  };
}

export function generateTokens(user: { id: string; email: string; name: string }) {
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: '7d',
  });
  const refreshToken = jwt.sign({ id: user.id, email: user.email }, JWT_REFRESH_SECRET, {
    expiresIn: '30d',
  });
  return { token, refreshToken };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Server-side RBAC Permission Middleware
 * Ensures user has at least one of the allowed roles
 */
export function requireRoles(allowedRoles: Role[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Lookup user's highest role in the active organization or workspace
    const orgMember = await prisma.orgMember.findFirst({
      where: { userId: req.user.id },
      select: { role: true },
    });

    const userRole = (orgMember?.role as Role) || 'MEMBER';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Forbidden: Role "${userRole}" lacks permission for this action. Allowed: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
