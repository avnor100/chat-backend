// src/groups/groups.controller.ts
import { Router } from 'express';
import { requireAuth } from '../auth/requireAuth.js';
import type { AuthRequest } from '../types.js';
import * as groups from './groups.service.js';

export const groupsRouter = Router();

// All /groups routes require auth
groupsRouter.use(requireAuth);

// GET /groups  → { groups: [...] }
groupsRouter.get('/', async (req, res) => {
  const r = req as AuthRequest;
  const userId = r.user!.id;
  const data = await groups.listGroupsForUser(userId);
  // your app handles either {items:[...]} or {groups:[...]} — we’ll keep {groups}
  res.json({ groups: data });
});

// POST /groups  → { group: {...} }
groupsRouter.post('/', async (req, res) => {
  const r = req as AuthRequest;
  const userId = r.user!.id;
  const { name } = (req.body ?? {}) as { name?: string };
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const group = await groups.createGroup(userId, name);
  res.json({ group });
});

// GET /groups/:id  → { group: {...} }
groupsRouter.get('/:id', async (req, res) => {
  const r = req as AuthRequest;
  const userId = r.user!.id;
  const { id } = req.params as { id: string };
  const member = await groups.isMember(userId, id);
  if (!member) return res.status(403).json({ error: 'Not a member' });
  const group = await groups.getGroup(id);
  res.json({ group });
});

// POST /groups/:id/invites  → { invite: {...} }
groupsRouter.post('/:id/invites', async (req, res) => {
  const r = req as AuthRequest;
  const userId = r.user!.id;
  const { id } = req.params as { id: string };
  const { expiresInHours, uses } = (req.body ?? {}) as {
    expiresInHours?: number;
    uses?: number;
  };

  const member = await groups.isMember(userId, id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const invite = await groups.createInvite(userId, id, expiresInHours, uses);
  res.json({ invite });
});

/* ---------------- Invites via token ---------------- */

export const invitesRouter = Router();

// POST /invites/:token/accept  → { joinedGroupId: "..." }
invitesRouter.post('/:token/accept', requireAuth, async (req, res) => {
  const r = req as AuthRequest;
  const userId = r.user!.id;
  const { token } = req.params as { token: string };

  try {
    const groupId = await groups.acceptInvite(userId, token);
    res.json({ joinedGroupId: groupId });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
