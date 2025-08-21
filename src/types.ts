import { Request } from 'express';

export interface JwtUser {
  id: string;
  email?: string | null;
  displayName: string;
}

export interface AuthRequest extends Request {
  user?: JwtUser;
}
