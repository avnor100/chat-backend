import { Router } from 'express';
import * as svc from './auth.service.js';
import { requireAuth } from './auth.middleware.js';

export const authRouter = Router();

authRouter.post('/guest', async (req, res) => {
  try {
    const { token, user } = await svc.guest();
    res.json({ token, user });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body || {};
    if (!email || !password || !displayName) return res.status(400).json({ error: 'Missing fields' });
    const { token, user } = await svc.register(email, password, displayName);
    res.json({ token, user });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const { token, user } = await svc.login(email, password);
    res.json({ token, user });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});
