import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] }
  );
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, name, password } = registerSchema.parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, name, passwordHash } });
    const token = signToken(user.id, user.email);

    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken(user.id, user.email);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.userId } });
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    next(err);
  }
}
