import { apiClient } from './client';

// Llave de localStorage para fallback de cupones
const MOCK_COUPONS_KEY = "smartlogix_mock_coupons";

function getMockCoupons(): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(MOCK_COUPONS_KEY);
  if (!raw) {
    // Cupones iniciales por defecto si no hay nada en localStorage
    const defaults = [
      { id: 1, code: "BIENVENIDA", discountPercent: 10, active: true, expiresAt: null, usageLimit: null, usageCount: 0 },
      { id: 2, code: "HARDWARE20", discountPercent: 20, active: true, expiresAt: null, usageLimit: null, usageCount: 0 }
    ];
    localStorage.setItem(MOCK_COUPONS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(raw);
}

function saveMockCoupons(coupons: any[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_COUPONS_KEY, JSON.stringify(coupons));
  }
}

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

  validateCoupon: async (code: string) => {
    try {
      return await apiClient<any>(`/api/orders/coupons/validate?code=${encodeURIComponent(code)}`);
    } catch (err) {
      console.warn("Fallo validacion en backend, usando mock local:", err);
      const coupons = getMockCoupons();
      const cleanCode = code.trim().toUpperCase();
      const coupon = coupons.find(c => c.code === cleanCode);
      if (!coupon) {
        return { valid: false, message: "Cupon no encontrado." };
      }
      if (!coupon.active) {
        return { valid: false, message: "El cupon esta desactivado." };
      }
      return { valid: true, code: coupon.code, discountPercent: coupon.discountPercent };
    }
  },

  getCoupons: async () => {
    try {
      return await apiClient<any[]>('/api/orders/coupons');
    } catch (err) {
      console.warn("Fallo getCoupons en backend, usando mock local:", err);
      return getMockCoupons();
    }
  },

  createCoupon: async (data: any) => {
    try {
      return await apiClient<any>('/api/orders/coupons', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn("Fallo createCoupon en backend, usando mock local:", err);
      const coupons = getMockCoupons();
      const cleanCode = data.code.trim().toUpperCase();
      if (coupons.some(c => c.code === cleanCode)) {
        throw new Error("El codigo de cupon ya existe localmente.");
      }
      const newCoupon = {
        id: Date.now(),
        code: cleanCode,
        discountPercent: Number(data.discountPercent),
        active: true,
        expiresAt: data.expiresAt || null,
        usageLimit: data.usageLimit || null,
        usageCount: 0
      };
      coupons.push(newCoupon);
      saveMockCoupons(coupons);
      return newCoupon;
    }
  },

  setCouponStatus: async (id: number, active: boolean) => {
    try {
      return await apiClient<any>(`/api/orders/coupons/${id}/status?active=${active}`, {
        method: 'PATCH',
      });
    } catch (err) {
      console.warn("Fallo setCouponStatus en backend, usando mock local:", err);
      const coupons = getMockCoupons();
      const coupon = coupons.find(c => c.id === id || c.id === Number(id));
      if (coupon) {
        coupon.active = active;
        saveMockCoupons(coupons);
      }
      return coupon;
    }
  },
};
