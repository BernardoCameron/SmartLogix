import { apiClient } from './client';

export const OrdersAPI = {
  getAll: async () => {
    return apiClient<any>('/api/orders');
  },
  getById: async (orderNumber: string) => {
    return apiClient<any>(`/api/orders/${orderNumber}`);
  },
  create: async (data: any) => {
    return apiClient<any>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateStatus: async (orderNumber: string, status: string) => {
    return apiClient<any>(`/api/orders/${orderNumber}/status?value=${status}`, {
      method: 'PATCH',
    });
  }
};
