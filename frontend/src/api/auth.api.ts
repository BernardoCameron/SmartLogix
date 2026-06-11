import { apiClient } from './client';

export const AuthAPI = {
  login: async (data: any) => {
    return apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  register: async (data: any) => {
    return apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};
