import { apiClient } from './client';

export const InventoryAPI = {
  getItems: async () => {
    return apiClient<any[]>('/api/inventory/items');
  },
  // catalogo publico: solo productos activos
  getCatalog: async () => {
    return apiClient<any[]>('/api/inventory/items/catalog');
  },
  getItemBySku: async (sku: string) => {
    return apiClient<any>(`/api/inventory/items/${sku}`);
  },
  createItem: async (data: any) => {
    return apiClient<any>('/api/inventory/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateStatus: async (sku: string, active: boolean) => {
    return apiClient<any>(`/api/inventory/items/${sku}/status?active=${active}`, {
      method: 'PATCH',
    });
  },
  addRating: async (sku: string, value: number) => {
    return apiClient<any>(`/api/inventory/items/${sku}/rating?value=${value}`, {
      method: 'POST',
    });
  },
  updateItem: async (sku: string, data: any) => {
    return apiClient<any>(`/api/inventory/items/${sku}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
