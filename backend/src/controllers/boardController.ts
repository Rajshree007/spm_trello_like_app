import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const memberSchema = z.object({ email: z.string().email() });

export async function listBoards(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const boards = await prisma.board.findMany({
      where: { members: { some: { userId: req.user!.userId } } },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(boards);
  } catch (err) { next(err); }
}

export async function createBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, background = '#0079BF' } = createSchema.parse(req.body);
    const userId = req.user!.userId;

    const board = await prisma.board.create({
      data: {
        title,
        background,
        ownerId: userId,
        members: { create: { userId, role: 'OWNER' } },
      },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    res.status(201).json(board);
  } catch (err) { next(err); }
}

export async function getBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: { labels: true, checklists: { include: { items: true } } },
            },
          },
        },
      },
    });

    if (!board) { res.status(404).json({ error: 'Board not found' }); return; }

    const isMember = board.members.some((m) => m.userId === req.user!.userId);
    if (!isMember) { res.status(403).json({ error: 'Access denied' }); return; }

    res.json(board);
  } catch (err) { next(err); }
}

export async function updateBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateSchema.parse(req.body);
    const board = await prisma.board.findUnique({ where: { id: req.params.id } });
    if (!board) { res.status(404).json({ error: 'Board not found' }); return; }
    if (board.ownerId !== req.user!.userId) { res.status(403).json({ error: 'Only owner can edit board' }); return; }

    const updated = await prisma.board.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function deleteBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const board = await prisma.board.findUnique({ where: { id: req.params.id } });
    if (!board) { res.status(404).json({ error: 'Board not found' }); return; }
    if (board.ownerId !== req.user!.userId) { res.status(403).json({ error: 'Only owner can delete board' }); return; }

    await prisma.board.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = memberSchema.parse(req.body);
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    });
    if (!board) { res.status(404).json({ error: 'Board not found' }); return; }
    if (board.ownerId !== req.user!.userId) { res.status(403).json({ error: 'Only owner can add members' }); return; }

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) { res.status(404).json({ error: 'User not found' }); return; }

    const alreadyMember = board.members.some((m) => m.userId === targetUser.id);
    if (alreadyMember) { res.status(409).json({ error: 'User is already a member' }); return; }

    await prisma.boardMember.create({ data: { userId: targetUser.id, boardId: board.id, role: 'MEMBER' } });
    res.status(201).json({ message: 'Member added', user: { id: targetUser.id, email: targetUser.email, name: targetUser.name } });
  } catch (err) { next(err); }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const board = await prisma.board.findUnique({ where: { id: req.params.id } });
    if (!board) { res.status(404).json({ error: 'Board not found' }); return; }
    if (board.ownerId !== req.user!.userId) { res.status(403).json({ error: 'Only owner can remove members' }); return; }
    if (req.params.userId === req.user!.userId) { res.status(400).json({ error: 'Owner cannot remove themselves' }); return; }

    await prisma.boardMember.deleteMany({ where: { boardId: board.id, userId: req.params.userId } });
    res.status(204).send();
  } catch (err) { next(err); }
}
