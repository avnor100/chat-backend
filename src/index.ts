import express from 'express';
import cors from 'cors';
import http from 'http';
import { config } from './config.js';
import { initSocket } from './socket/socket.js';
import { authRouter } from './auth/auth.controller.js';
import { groupsRouter, invitesRouter } from './groups/groups.controller.js';
import { messagesRouter } from './messages/messages.controller.js';

const app = express();
app.use(cors());
app.use(express.json());

// Health endpoint for testing
app.get('/', (_, res) =>
  res.json({
    ok: true,
    name: 'chat-backend-base',
    time: new Date().toISOString(),
  })
);

// API routes
app.use('/auth', authRouter);
app.use('/groups', groupsRouter);
app.use('/invites', invitesRouter);
app.use('/groups', messagesRouter); // messages under /groups/:groupId/messages

// HTTP + Socket server
const server = http.createServer(app);
initSocket(server);

// Use PORT from environment if provided (Render/Azure)
const PORT = Number(process.env.PORT) || config.port || 4000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
