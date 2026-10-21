import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  listBoards, createBoard, getBoard, updateBoard, deleteBoard, addMember, removeMember,
} from '../controllers/boardController';

const router = Router();

router.use(authenticate);

router.get('/', listBoards);
router.post('/', createBoard);
router.get('/:id', getBoard);
router.patch('/:id', updateBoard);
router.delete('/:id', deleteBoard);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

export default router;
