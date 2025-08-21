import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AuthRequest, JwtUser } from '../types.js';

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const hdr = req.headers['authorization'];
    const token = hdr?.startsWith('Bearer ') ? hdr.slice(7) : (req.query['token'] as string | undefined);
    if (!token) return res.status(401).json({ error: 'Missing Bearer token' });
    const payload = jwt.verify(token, config.jwtSecret) as any;
    const user: JwtUser = { id: payload.sub, email: payload.email, displayName: payload.displayName };
    req.user = user;
    next();
  } catch (e: any) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
