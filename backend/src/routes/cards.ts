import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getCards, createCard, getCard, updateCard, deleteCard, moveCard,
  addLabel, deleteLabel,
  createChecklist, deleteChecklist,
  addChecklistItem, updateChecklistItem, deleteChecklistItem,
} from '../controllers/cardController';

const router = Router({ mergeParams: true });
router.use(authenticate);

// Mounted at /api/lists/:listId/cards
router.get('/', getCards);
router.post('/', createCard);

// Mounted at /api/cards
router.get('/:id', getCard);
router.patch('/:id', updateCard);
router.delete('/:id', deleteCard);
router.patch('/:id/move', moveCard);

// Labels
router.post('/:id/labels', addLabel);
router.delete('/:id/labels/:labelId', deleteLabel);

// Checklists
router.post('/:id/checklists', createChecklist);
router.delete('/:id/checklists/:checklistId', deleteChecklist);
router.post('/:id/checklists/:checklistId/items', addChecklistItem);
router.patch('/:id/checklists/:checklistId/items/:itemId', updateChecklistItem);
router.delete('/:id/checklists/:checklistId/items/:itemId', deleteChecklistItem);

export default router;
