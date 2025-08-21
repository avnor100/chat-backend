# Chat Backend Base (Express + Socket.IO + Prisma + Postgres)

A production-grade **starter backend** for a chat app with **groups**, **messages**, **QR-code invites**, and **JWT auth**.
- **Express + Socket.IO** for HTTP + real-time
- **Postgres + Prisma** for data
- **JWT** auth (guest + email/password)
- **Invites with tokens** (perfect for QR codes)
- **Docker Compose** for Postgres & Redis
- Clean architecture with feature modules

> Built on 2025-08-14 — ready to run locally or deploy.

## Quick start

### 1) Clone and configure env
```bash
cp .env.example .env
# Edit .env if needed
```

### 2) Start databases
```bash
docker compose up -d
```

### 3) Install deps & migrate
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
```

### 4) Run the server (dev)
```bash
npm run dev
# Server on http://localhost:4000
```

---

## Features

### Auth
- **Guest sign-in** (`POST /auth/guest`) → creates a user and returns a JWT.
- **Email/password** register/login (`/auth/register`, `/auth/login`) with bcrypt hashing.
- `GET /me` to fetch your profile.

### Groups & Invites
- Create/list groups (`POST /groups`, `GET /groups`).
- Create invite tokens (`POST /groups/:id/invites`) with expiry/usage limits.
- Accept invites (`POST /invites/:token/accept`).
- Members are tracked in a join table with roles.

### Messages
- Send message (`POST /groups/:id/messages`).
- List messages with forward pagination (`GET /groups/:id/messages?cursor=...&limit=...`).

### Real-time (Socket.IO)
- Client authenticates with a Bearer token (`auth.token` or `auth` header).
- Join group rooms automatically when you send/receive; or call `room:join`.
- When someone sends a message, server emits `message:new` to the group's room.

### QR flow
- **Generate** an invite token via `POST /groups/:id/invites`.
- Encode that token into a QR code in your app.
- On scan, app calls `POST /invites/:token/accept` with the user’s JWT → user joins group.

---

## Handy endpoints

- `POST /auth/guest`
- `POST /auth/register`  body: `{ email, password, displayName }`
- `POST /auth/login`     body: `{ email, password }`
- `GET  /me`

- `GET  /groups`
- `POST /groups`         body: `{ name }`
- `GET  /groups/:id`
- `POST /groups/:id/invites` body: `{ expiresInHours?: number, uses?: number }`
- `POST /invites/:token/accept`

- `GET  /groups/:id/messages?cursor=<createdAtISO>&limit=30`
- `POST /groups/:id/messages` body: `{ text }`

---

## Project structure
```
src/
  index.ts                # server bootstrap
  config.ts               # env + config
  prisma.ts               # Prisma client
  types.ts                # shared types
  auth/
    auth.controller.ts
    auth.service.ts
    auth.middleware.ts
    password.ts
  groups/
    groups.controller.ts
    groups.service.ts
  messages/
    messages.controller.ts
  socket/
    socket.ts             # socket.io setup
prisma/
  schema.prisma
docker-compose.yml
.env.example
```

---

## Notes
- JWT secret: configure `JWT_SECRET` in `.env` (defaults provided for dev).
- Prisma uses `DATABASE_URL` (from `.env`). Migrations are included.
- Redis is included in Docker and available (reserved for presence/typing extensions).
- This starter is intentionally lean; you can add rate limiting, logging, tracing, tests, and CI easily.

---

## Deploying
- Works on Fly.io, Render, Railway, or a VM (Docker image recommended).
- Provision Postgres + Redis, set environment variables, run `prisma migrate deploy`, then start `node dist/index.js`.
