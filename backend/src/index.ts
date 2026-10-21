import 'dotenv/config';
import express, { Router } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import boardRoutes from './routes/boards';
import listRoutes from './routes/lists';
import cardRoutes from './routes/cards';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/authenticate';
import { updateList, deleteList } from './controllers/listController';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/boards', boardRoutes);
  app.use('/api/boards/:boardId/lists', listRoutes);

  // Standalone list PATCH/DELETE — controller resolves board membership from DB
  const listStandaloneRouter = Router();
  listStandaloneRouter.use(authenticate);
  listStandaloneRouter.patch('/:id', updateList);
  listStandaloneRouter.delete('/:id', deleteList);
  app.use('/api/lists', listStandaloneRouter);

  app.use('/api/lists/:listId/cards', cardRoutes);
  app.use('/api/cards', cardRoutes);

  app.use(errorHandler);

  return app;
}

if (require.main === module) {
  const PORT = process.env.PORT ?? 3001;
  const app = createApp();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
