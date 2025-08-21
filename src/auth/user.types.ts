// src/auth/user.types.ts
export interface JwtUser {
  id: string;
  email?: string | null;
  displayName?: string | null;
}
