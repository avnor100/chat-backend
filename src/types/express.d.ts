// src/types/express.d.ts
import type { JwtUser } from "../auth/user.types";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}
export {};
