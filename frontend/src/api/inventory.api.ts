import { apiClient } from './client';

export const InventoryAPI = {
  getItems: async () => {
    return apiClient<any>('/api/inventory/items');
  }
};
