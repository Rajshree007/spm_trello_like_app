import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getLists, createList, updateList, deleteList, reorderLists } from '../controllers/listController';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Mounted at /api/boards/:boardId/lists
router.get('/', getLists);
router.post('/', createList);
router.patch('/reorder', reorderLists);
router.patch('/:id', updateList);
router.delete('/:id', deleteList);

export default router;
