import { apiClient } from './client';
import type { Board } from '../types';

export const boardsApi = {
  list: () => apiClient.get<Board[]>('/boards').then((r) => r.data),

  get: (id: string) => apiClient.get<Board>(`/boards/${id}`).then((r) => r.data),

  create: (data: { title: string; background?: string }) =>
    apiClient.post<Board>('/boards', data).then((r) => r.data),

  update: (id: string, data: { title?: string; background?: string }) =>
    apiClient.patch<Board>(`/boards/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/boards/${id}`),

  addMember: (id: string, email: string) =>
    apiClient.post(`/boards/${id}/members`, { email }).then((r) => r.data),

  removeMember: (id: string, userId: string) =>
    apiClient.delete(`/boards/${id}/members/${userId}`),
};
