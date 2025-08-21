import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { prisma } from '../prisma.js';
import * as groups from '../groups/groups.service.js';
import { io } from '../socket/socket.js';

export const messagesRouter = Router();
messagesRouter.use(requireAuth);

// List messages (newest first) with cursor pagination by createdAt
messagesRouter.get('/:groupId/messages', async (req: any, res) => {
  const userId = req.user!.id;
  const { groupId } = req.params;
  const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
  const cursorISO = req.query.cursor as string | undefined;
  const member = await groups.isMember(userId, groupId);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const where: any = { groupId };
  const orderBy: any = { createdAt: 'desc' };
  // If cursor is provided, fetch items created before that timestamp
  const cursorDate = cursorISO ? new Date(cursorISO) : null;

  const items = await prisma.message.findMany({
    where: cursorDate ? { ...where, createdAt: { lt: cursorDate } } : where,
    orderBy,
    take: limit,
  });
  const nextCursor = items.length === limit ? items[items.length - 1].createdAt.toISOString() : null;
  res.json({ items, nextCursor });
});

// Send a message
messagesRouter.post('/:groupId/messages', async (req: any, res) => {
  const userId = req.user!.id;
  const { groupId } = req.params;
  const { text } = req.body || {};
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Invalid text' });
  const member = await groups.isMember(userId, groupId);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const msg = await prisma.message.create({
    data: { groupId, userId, text },
  });
  // emit to socket room
  io.to(`group:${groupId}`).emit('message:new', { message: msg });
  res.json({ message: msg });
});
