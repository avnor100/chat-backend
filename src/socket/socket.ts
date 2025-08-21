import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../prisma.js';

let _io: Server;

export function initSocket(server: http.Server) {
  _io = new Server(server, { cors: { origin: '*' } });

  _io.use(async (socket, next) => {
    try {
      const token = (socket.handshake.auth?.token || socket.handshake.headers['authorization']) as string | undefined;
      const raw = token?.startsWith('Bearer ') ? token.slice(7) : token;
      if (!raw) return next(new Error('Missing token'));
      const payload = jwt.verify(raw, config.jwtSecret) as any;
      (socket as any).userId = payload.sub as string;
      next();
    } catch (e) {
      next(new Error('Auth failed'));
    }
  });

  _io.on('connection', async (socket) => {
    const userId = (socket as any).userId as string;

    socket.on('room:join', async (groupId: string) => {
      // Verify membership before joining room
      const member = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId } },
      });
      if (member) socket.join(`group:${groupId}`);
    });

    socket.on('message:send', async (payload: { groupId: string; text: string }) => {
      try {
        const { groupId, text } = payload;
        if (!text) return;
        const member = await prisma.groupMember.findUnique({
          where: { userId_groupId: { userId, groupId } },
        });
        if (!member) return;
        const msg = await prisma.message.create({ data: { groupId, userId, text } });
        _io.to(`group:${groupId}`).emit('message:new', { message: msg });
      } catch (e) {
        // swallow errors for demo
      }
    });

    socket.on('typing', (payload: { groupId: string; isTyping: boolean }) => {
      if (!payload?.groupId) return;
      socket.to(`group:${payload.groupId}`).emit('typing', { userId, isTyping: !!payload.isTyping });
    });
  });

  return _io;
}

export const io = {
  to: (room: string) => _io.to(room),
  emit: (...args: any[]) => _io.emit.apply(_io, args as any),
} as unknown as Server;
