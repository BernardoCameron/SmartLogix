import { apiClient } from './client';

export const ShipmentsAPI = {
  getAll: async () => {
    return apiClient<any>('/api/shipments');
  }
};
