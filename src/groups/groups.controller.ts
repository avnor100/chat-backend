import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import * as groups from './groups.service.js';

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

groupsRouter.get('/', async (req: any, res) => {
  const userId = req.user!.id;
  const data = await groups.listGroupsForUser(userId);
  res.json({ groups: data });
});

groupsRouter.post('/', async (req: any, res) => {
  const userId = req.user!.id;
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const group = await groups.createGroup(userId, name);
  res.json({ group });
});

groupsRouter.get('/:id', async (req: any, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const member = await groups.isMember(userId, id);
  if (!member) return res.status(403).json({ error: 'Not a member' });
  const group = await groups.getGroup(id);
  res.json({ group });
});

groupsRouter.post('/:id/invites', async (req: any, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { expiresInHours, uses } = req.body || {};
  const member = await groups.isMember(userId, id);
  if (!member) return res.status(403).json({ error: 'Not a member' });
  const invite = await groups.createInvite(userId, id, expiresInHours, uses);
  res.json({ invite });
});

// Accept invite via token
export const invitesRouter = Router();
invitesRouter.post('/:token/accept', requireAuth, async (req: any, res) => {
  const userId = req.user!.id;
  const { token } = req.params;
  try {
    const groupId = await groups.acceptInvite(userId, token);
    res.json({ joinedGroupId: groupId });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
