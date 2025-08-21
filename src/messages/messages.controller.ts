import { Router, type RequestHandler } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthRequest } from '../types.js';
import { prisma } from '../prisma.js';
import * as groups from '../groups/groups.service.js';
import { io } from '../socket/socket.js';

export const messagesRouter = Router();

messagesRouter.use(requireAuth);

// GET /groups/:groupId/messages
const listMessages: RequestHandler = async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const userId = user!.id;
    const { groupId } = req.params;
    const limit = Math.min(parseInt((req.query.limit as string) || '30', 10), 100);
    const cursorISO = req.query.cursor as string | undefined;

    const member = await groups.isMember(userId, groupId);
    if (!member) return res.status(403).json({ error: 'Not a member' });

    const where: any = { groupId };
    const orderBy: any = { createdAt: 'desc' };
    const cursorDate = cursorISO ? new Date(cursorISO) : null;

    const items = await prisma.message.findMany({
      where: cursorDate ? { ...where, createdAt: { lt: cursorDate } } : where,
      orderBy,
      take: limit,
    });

    const nextCursor =
      items.length === limit ? items[items.length - 1].createdAt.toISOString() : null;

    return res.json({ items, nextCursor });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

// POST /groups/:groupId/messages
const postMessage: RequestHandler = async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const userId = user!.id;
    const { groupId } = req.params;
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Invalid text' });
    }

    const member = await groups.isMember(userId, groupId);
    if (!member) return res.status(403).json({ error: 'Not a member' });

    const msg = await prisma.message.create({
      data: { groupId, userId, text },
    });

    io.to(`group:${groupId}`).emit('message:new', { message: msg });
    return res.json({ message: msg });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

messagesRouter.get('/:groupId/messages', listMessages);
messagesRouter.post('/:groupId/messages', postMessage);
