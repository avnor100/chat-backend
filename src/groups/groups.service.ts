import { prisma } from '../prisma.js';

export async function listGroupsForUser(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: true },
    orderBy: { joinedAt: 'desc' },
  });
  return memberships.map(m => ({
    id: m.group.id,
    name: m.group.name,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}

export async function createGroup(userId: string, name: string) {
  const group = await prisma.group.create({
    data: {
      name,
      createdById: userId,
      members: {
        create: { userId, role: 'owner' },
      },
    },
  });
  return group;
}

export async function getGroup(groupId: string) {
  return prisma.group.findUnique({ where: { id: groupId } });
}

export async function isMember(userId: string, groupId: string) {
  const m = await prisma.groupMember.findUnique({ where: { userId_groupId: { userId, groupId } } });
  return !!m;
}

export async function addMember(userId: string, groupId: string) {
  try {
    await prisma.groupMember.create({ data: { userId, groupId, role: 'member' } });
  } catch { /* ignore if exists */ }
}

export async function createInvite(userId: string, groupId: string, expiresInHours?: number, uses?: number) {
  const token = crypto.randomUUID();
  const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 3600_000) : null;
  const invite = await prisma.invite.create({
    data: { token, groupId, createdById: userId, expiresAt: expiresAt ?? undefined, usesRemaining: uses ?? undefined },
  });
  return invite;
}

export async function acceptInvite(userId: string, token: string) {
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) throw new Error('Invite not found');
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) throw new Error('Invite expired');
  if (invite.usesRemaining !== null && invite.usesRemaining !== undefined && invite.usesRemaining <= 0) throw new Error('Invite exhausted');
  // add member
  await addMember(userId, invite.groupId);
  // decrement usesRemaining if set
  if (invite.usesRemaining !== null && invite.usesRemaining !== undefined) {
    await prisma.invite.update({
      where: { token },
      data: { usesRemaining: invite.usesRemaining - 1 },
    });
  }
  return invite.groupId;
}
