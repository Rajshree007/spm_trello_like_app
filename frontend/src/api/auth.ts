import { apiClient } from './client';
import type { AuthResponse, User } from '../types';

export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),
};
