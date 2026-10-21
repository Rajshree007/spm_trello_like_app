import { apiClient } from './client';
import type { List } from '../types';

export const listsApi = {
  list: (boardId: string) =>
    apiClient.get<List[]>(`/boards/${boardId}/lists`).then((r) => r.data),

  create: (boardId: string, data: { title: string }) =>
    apiClient.post<List>(`/boards/${boardId}/lists`, data).then((r) => r.data),

  update: (id: string, data: { title?: string; position?: number }) =>
    apiClient.patch<List>(`/lists/${id}`, data).then((r) => r.data),

  delete: (boardId: string, id: string) =>
    apiClient.delete(`/boards/${boardId}/lists/${id}`),

  reorder: (boardId: string, listIds: string[]) =>
    apiClient.patch(`/boards/${boardId}/lists/reorder`, { listIds }).then((r) => r.data),
};
