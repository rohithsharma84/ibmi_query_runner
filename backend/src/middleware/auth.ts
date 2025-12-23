import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    isAdmin: boolean;
  };
  token?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      isAdmin: decoded.isAdmin,
    };
    req.token = token;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireAuth = authMiddleware;
export const requireAdmin = [authMiddleware, adminMiddleware];
