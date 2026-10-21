import request from 'supertest';
import { createApp } from '../src/index';
import { prisma } from '../src/lib/prisma';

export const app = createApp();

export async function clearDb() {
  await prisma.activity.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.label.deleteMany();
  await prisma.card.deleteMany();
  await prisma.list.deleteMany();
  await prisma.boardMember.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();
}

export async function registerAndLogin(email: string, name: string, password = 'password123') {
  const res = await request(app).post('/api/auth/register').send({ email, name, password });
  return { token: res.body.token as string, user: res.body.user };
}
