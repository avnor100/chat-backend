import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtUser, AuthRequest } from '../types.js';

// ✅ Re-export the AuthRequest type so other modules can import it from here if they want.
export type { AuthRequest } from '../types.js';

/**
 * Express middleware that validates Bearer JWT and attaches it to req.user
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = auth.slice('Bearer '.length).trim();
    const secret = process.env.JWT_SECRET || 'dev-secret';

    const payload = jwt.verify(token, secret) as JwtUser;

    // attach strongly-typed user
    (req as AuthRequest).user = payload;
    return next();
  } catch (e: any) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
