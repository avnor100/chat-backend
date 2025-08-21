import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { hashPassword, comparePassword } from './password.js';
function signToken(user) {
    return jwt.sign({ sub: user.id, email: user.email, displayName: user.displayName }, config.jwtSecret, {
        expiresIn: '30d',
    });
}
export async function guest() {
    const displayName = 'Guest-' + Math.random().toString(36).slice(2, 8);
    const user = await prisma.user.create({
        data: { displayName },
    });
    const token = signToken(user);
    return { token, user };
}
export async function register(email, password, displayName) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
        throw new Error('Email already in use');
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: { email, passwordHash, displayName },
    });
    const token = signToken(user);
    return { token, user };
}
export async function login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash)
        throw new Error('Invalid credentials');
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok)
        throw new Error('Invalid credentials');
    const token = signToken(user);
    return { token, user };
}
