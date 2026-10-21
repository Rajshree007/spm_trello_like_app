import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const createSchema = z.object({ title: z.string().min(1).max(200) });
const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  position: z.number().optional(),
});

async function assertBoardMember(boardId: string, userId: string): Promise<boolean> {
  const member = await prisma.boardMember.findUnique({ where: { userId_boardId: { userId, boardId } } });
  return !!member;
}

export async function getLists(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId } = req.params;
    const isMember = await assertBoardMember(boardId, req.user!.userId);
    if (!isMember) { res.status(403).json({ error: 'Access denied' }); return; }

    const lists = await prisma.list.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      include: { cards: { orderBy: { position: 'asc' }, include: { labels: true } } },
    });
    res.json(lists);
  } catch (err) { next(err); }
}

export async function createList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId } = req.params;
    const isMember = await assertBoardMember(boardId, req.user!.userId);
    if (!isMember) { res.status(403).json({ error: 'Access denied' }); return; }

    const { title } = createSchema.parse(req.body);
    const last = await prisma.list.findFirst({ where: { boardId }, orderBy: { position: 'desc' } });
    const position = (last?.position ?? 0) + 1;

    const list = await prisma.list.create({
      data: { title, position, boardId },
      include: { cards: true },
    });
    res.status(201).json(list);
  } catch (err) { next(err); }
}

export async function updateList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await prisma.list.findUnique({ where: { id: req.params.id } });
    if (!list) { res.status(404).json({ error: 'List not found' }); return; }

    const isMember = await assertBoardMember(list.boardId, req.user!.userId);
    if (!isMember) { res.status(403).json({ error: 'Access denied' }); return; }

    const data = updateSchema.parse(req.body);
    const updated = await prisma.list.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function deleteList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await prisma.list.findUnique({ where: { id: req.params.id } });
    if (!list) { res.status(404).json({ error: 'List not found' }); return; }

    const isMember = await assertBoardMember(list.boardId, req.user!.userId);
    if (!isMember) { res.status(403).json({ error: 'Access denied' }); return; }

    await prisma.list.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function reorderLists(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId } = req.params;
    const isMember = await assertBoardMember(boardId, req.user!.userId);
    if (!isMember) { res.status(403).json({ error: 'Access denied' }); return; }

    const orderedIds = z.array(z.string()).parse(req.body.listIds);

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.list.update({ where: { id }, data: { position: index + 1 } })
      )
    );
    res.json({ success: true });
  } catch (err) { next(err); }
}
