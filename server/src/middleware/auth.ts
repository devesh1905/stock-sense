import { Request, Response, NextFunction } from 'express';
import { verifyToken, UserTokenPayload } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    loginId: string;
    email: string;
    name: string;
    role: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    let payload: UserTokenPayload;
    try {
      payload = verifyToken(token);
    } catch {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        loginId: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      res.status(401).json({ error: 'User account no longer exists' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
