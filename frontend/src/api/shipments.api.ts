import { apiClient } from './client';

export const ShipmentsAPI = {
  getAll: async () => {
    return apiClient<any[]>('/api/shipments');
  },
  getByTrackingCode: async (trackingCode: string) => {
    return apiClient<any>(`/api/shipments/${trackingCode}`);
  },
  updateStatus: async (trackingCode: string, status: string) => {
    return apiClient<any>(`/api/shipments/${trackingCode}/status?value=${status}`, {
      method: 'PATCH',
    });
  },
};
