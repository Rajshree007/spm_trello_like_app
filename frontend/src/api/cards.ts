import { apiClient } from './client';
import type { Card, Label, Checklist, ChecklistItem } from '../types';

export const cardsApi = {
  create: (listId: string, data: { title: string }) =>
    apiClient.post<Card>(`/lists/${listId}/cards`, data).then((r) => r.data),

  get: (id: string) => apiClient.get<Card>(`/cards/${id}`).then((r) => r.data),

  update: (id: string, data: Partial<Pick<Card, 'title' | 'description' | 'dueDate' | 'position'>>) =>
    apiClient.patch<Card>(`/cards/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/cards/${id}`),

  move: (id: string, data: { listId: string; position: number }) =>
    apiClient.patch<Card>(`/cards/${id}/move`, data).then((r) => r.data),

  addLabel: (cardId: string, data: { name: string; color: string }) =>
    apiClient.post<Label>(`/cards/${cardId}/labels`, data).then((r) => r.data),

  deleteLabel: (cardId: string, labelId: string) =>
    apiClient.delete(`/cards/${cardId}/labels/${labelId}`),

  createChecklist: (cardId: string, data: { title: string }) =>
    apiClient.post<Checklist>(`/cards/${cardId}/checklists`, data).then((r) => r.data),

  deleteChecklist: (cardId: string, checklistId: string) =>
    apiClient.delete(`/cards/${cardId}/checklists/${checklistId}`),

  addChecklistItem: (cardId: string, checklistId: string, data: { text: string }) =>
    apiClient.post<ChecklistItem>(`/cards/${cardId}/checklists/${checklistId}/items`, data).then((r) => r.data),

  updateChecklistItem: (cardId: string, checklistId: string, itemId: string, data: { completed?: boolean; text?: string }) =>
    apiClient.patch<ChecklistItem>(`/cards/${cardId}/checklists/${checklistId}/items/${itemId}`, data).then((r) => r.data),

  deleteChecklistItem: (cardId: string, checklistId: string, itemId: string) =>
    apiClient.delete(`/cards/${cardId}/checklists/${checklistId}/items/${itemId}`),
};
