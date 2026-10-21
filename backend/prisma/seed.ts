import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'juan@example.com' },
    update: {},
    create: { email: 'juan@example.com', name: 'Juan Amaya', passwordHash },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: 'Bob Smith', passwordHash },
  });

  const board = await prisma.board.create({
    data: {
      title: 'Product Roadmap',
      background: '#0079BF',
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const todoList = await prisma.list.create({
    data: { title: 'To Do', position: 1, boardId: board.id },
  });
  const inProgressList = await prisma.list.create({
    data: { title: 'In Progress', position: 2, boardId: board.id },
  });
  const doneList = await prisma.list.create({
    data: { title: 'Done', position: 3, boardId: board.id },
  });

  await prisma.card.createMany({
    data: [
      { title: 'Design new landing page', description: 'Redesign the homepage with modern UI', position: 1, listId: todoList.id },
      { title: 'Set up CI/CD pipeline', description: 'Automate deployments with GitHub Actions', position: 2, listId: todoList.id },
      { title: 'Write API documentation', position: 3, listId: todoList.id },
      { title: 'Implement authentication', description: 'JWT-based auth with refresh tokens', position: 1, listId: inProgressList.id },
      { title: 'Build dashboard analytics', position: 2, listId: inProgressList.id },
      { title: 'User research interviews', description: 'Conduct 5 user interviews', position: 1, listId: doneList.id },
      { title: 'Project kickoff meeting', position: 2, listId: doneList.id },
    ],
  });

  const personalBoard = await prisma.board.create({
    data: {
      title: 'Personal Tasks',
      background: '#519839',
      ownerId: alice.id,
      members: { create: [{ userId: alice.id, role: 'OWNER' }] },
    },
  });

  const personalBacklog = await prisma.list.create({
    data: { title: 'Backlog', position: 1, boardId: personalBoard.id },
  });

  await prisma.card.createMany({
    data: [
      { title: 'Read Clean Code book', position: 1, listId: personalBacklog.id },
      { title: 'Practice TypeScript', position: 2, listId: personalBacklog.id },
    ],
  });

  console.log('Seed completed.');
  console.log('Test credentials: juan@example.com / password123');
  console.log('                  bob@example.com / password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
