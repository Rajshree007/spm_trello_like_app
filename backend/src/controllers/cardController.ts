import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const createSchema = z.object({ title: z.string().min(1).max(500) });

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  position: z.number().optional(),
});

const moveSchema = z.object({
  listId: z.string(),
  position: z.number(),
});

const labelSchema = z.object({
  name: z.string().max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const checklistSchema = z.object({ title: z.string().min(1).max(200) });
const checklistItemSchema = z.object({ text: z.string().min(1).max(500) });
const checklistItemUpdateSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
});

async function assertCardAccess(cardId: string, userId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { list: { include: { board: { include: { members: true } } } } },
  });
  if (!card) return null;
  const isMember = card.list.board.members.some((m) => m.userId === userId);
  return isMember ? card : null;
}

export async function getCards(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const member = await prisma.boardMember.findFirst({
      where: { userId: req.user!.userId, board: { lists: { some: { id: req.params.listId } } } },
    });
    if (!member) { res.status(403).json({ error: 'Access denied' }); return; }

    const cards = await prisma.card.findMany({
      where: { listId: req.params.listId },
      orderBy: { position: 'asc' },
      include: { labels: true, checklists: { include: { items: true } } },
    });
    res.json(cards);
  } catch (err) { next(err); }
}

export async function createCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await prisma.list.findUnique({
      where: { id: req.params.listId },
      include: { board: { include: { members: true } } },
    });
    if (!list) { res.status(404).json({ error: 'List not found' }); return; }

    const isMember = list.board.members.some((m) => m.userId === req.user!.userId);
    if (!isMember) { res.status(403).json({ error: 'Access denied' }); return; }

    const { title } = createSchema.parse(req.body);
    const last = await prisma.card.findFirst({ where: { listId: list.id }, orderBy: { position: 'desc' } });
    const position = (last?.position ?? 0) + 1;

    const card = await prisma.card.create({
      data: { title, position, listId: list.id },
      include: { labels: true, checklists: { include: { items: true } } },
    });
    res.status(201).json(card);
  } catch (err) { next(err); }
}

export async function getCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const card = await assertCardAccess(req.params.id, req.user!.userId);
    if (!card) { res.status(404).json({ error: 'Card not found or access denied' }); return; }

    const full = await prisma.card.findUnique({
      where: { id: req.params.id },
      include: {
        labels: true,
        checklists: { include: { items: { orderBy: { position: 'asc' } } } },
        activities: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    res.json(full);
  } catch (err) { next(err); }
}

export async function updateCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const card = await assertCardAccess(req.params.id, req.user!.userId);
    if (!card) { res.status(404).json({ error: 'Card not found or access denied' }); return; }

    const raw = updateSchema.parse(req.body);
    const data: Record<string, unknown> = {};
    if (raw.title !== undefined) data.title = raw.title;
    if (raw.description !== undefined) data.description = raw.description;
    if (raw.dueDate !== undefined) data.dueDate = raw.dueDate ? new Date(raw.dueDate) : null;
    if (raw.position !== undefined) data.position = raw.position;

    const updated = await prisma.card.update({
      where: { id: req.params.id },
      data,
      include: { labels: true, checklists: { include: { items: true } } },
    });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function deleteCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const card = await assertCardAccess(req.params.id, req.user!.userId);
    if (!card) { res.status(404).json({ error: 'Card not found or access denied' }); return; }

    await prisma.card.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function moveCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const card = await assertCardAccess(req.params.id, req.user!.userId);
    if (!card) { res.status(404).json({ error: 'Card not found or access denied' }); return; }

    const { listId, position } = moveSchema.parse(req.body);

    const targetList = await prisma.list.findUnique({
      where: { id: listId },
      include: { board: { include: { members: true } } },
    });
    if (!targetList) { res.status(404).json({ error: 'Target list not found' }); return; }

    const hasAccess = targetList.board.members.some((m) => m.userId === req.user!.userId);
    if (!hasAccess) { res.status(403).json({ error: 'Access denied to target board' }); return; }

    const updated = await prisma.card.update({
      where: { id: req.params.id },
      data: { listId, position },
      include: { labels: true, checklists: { include: { items: true } } },
    });

    await prisma.activity.create({
      data: {
        text: `moved this card to "${targetList.title}"`,
        cardId: req.params.id,
        userId: req.user!.userId,
      },
    });

    res.json(updated);
  } catch (err) { next(err); }
}

export async function addLabel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const card = await assertCardAccess(req.params.id, req.user!.userId);
    if (!card) { res.status(404).json({ error: 'Card not found or access denied' }); return; }

    const { name, color } = labelSchema.parse(req.body);
    const label = await prisma.label.create({ data: { name, color, cardId: req.params.id } });
    res.status(201).json(label);
  } catch (err) { next(err); }
}

export async function deleteLabel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const label = await prisma.label.findUnique({ where: { id: req.params.labelId } });
    if (!label) { res.status(404).json({ error: 'Label not found' }); return; }

    const card = await assertCardAccess(label.cardId, req.user!.userId);
    if (!card) { res.status(403).json({ error: 'Access denied' }); return; }

    await prisma.label.delete({ where: { id: req.params.labelId } });
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function createChecklist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const card = await assertCardAccess(req.params.id, req.user!.userId);
    if (!card) { res.status(404).json({ error: 'Card not found or access denied' }); return; }

    const { title } = checklistSchema.parse(req.body);
    const checklist = await prisma.checklist.create({
      data: { title, cardId: req.params.id },
      include: { items: true },
    });
    res.status(201).json(checklist);
  } catch (err) { next(err); }
}

export async function deleteChecklist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const checklist = await prisma.checklist.findUnique({ where: { id: req.params.checklistId } });
    if (!checklist) { res.status(404).json({ error: 'Checklist not found' }); return; }

    const card = await assertCardAccess(checklist.cardId, req.user!.userId);
    if (!card) { res.status(403).json({ error: 'Access denied' }); return; }

    await prisma.checklist.delete({ where: { id: req.params.checklistId } });
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function addChecklistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const checklist = await prisma.checklist.findUnique({ where: { id: req.params.checklistId } });
    if (!checklist) { res.status(404).json({ error: 'Checklist not found' }); return; }

    const card = await assertCardAccess(checklist.cardId, req.user!.userId);
    if (!card) { res.status(403).json({ error: 'Access denied' }); return; }

    const { text } = checklistItemSchema.parse(req.body);
    const count = await prisma.checklistItem.count({ where: { checklistId: req.params.checklistId } });
    const item = await prisma.checklistItem.create({
      data: { text, checklistId: req.params.checklistId, position: count },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateChecklistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.checklistItem.findUnique({
      where: { id: req.params.itemId },
      include: { checklist: true },
    });
    if (!item) { res.status(404).json({ error: 'Item not found' }); return; }

    const card = await assertCardAccess(item.checklist.cardId, req.user!.userId);
    if (!card) { res.status(403).json({ error: 'Access denied' }); return; }

    const data = checklistItemUpdateSchema.parse(req.body);
    const updated = await prisma.checklistItem.update({ where: { id: req.params.itemId }, data });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function deleteChecklistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.checklistItem.findUnique({
      where: { id: req.params.itemId },
      include: { checklist: true },
    });
    if (!item) { res.status(404).json({ error: 'Item not found' }); return; }

    const card = await assertCardAccess(item.checklist.cardId, req.user!.userId);
    if (!card) { res.status(403).json({ error: 'Access denied' }); return; }

    await prisma.checklistItem.delete({ where: { id: req.params.itemId } });
    res.status(204).send();
  } catch (err) { next(err); }
}
