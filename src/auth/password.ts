import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, ROUNDS);
}

export function comparePassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
