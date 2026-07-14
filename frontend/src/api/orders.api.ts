import { apiClient } from './client';

export const OrdersAPI = {
  getAll: async () => {
    return apiClient<any[]>('/api/orders');
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
  },
  // validar cupon contra el backend antes de aplicarlo
  validateCoupon: async (code: string) => {
    return apiClient<any>(`/api/orders/coupons/validate?code=${encodeURIComponent(code)}`);
  },
  // listar cupones (admin)
  getCoupons: async () => {
    return apiClient<any[]>('/api/orders/coupons');
  },
  // crear cupon (admin)
  createCoupon: async (data: any) => {
    return apiClient<any>('/api/orders/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  // activar o desactivar cupon (admin)
  setCouponStatus: async (id: number, active: boolean) => {
    return apiClient<any>(`/api/orders/coupons/${id}/status?active=${active}`, {
      method: 'PATCH',
    });
  },
};
