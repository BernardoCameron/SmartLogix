import { OrdersAPI } from '../api/orders.api';

export const OrdersService = {
  getAllOrders: async () => {
    return OrdersAPI.getAll();
  },
  getOrderById: async (orderNumber: string) => {
    return OrdersAPI.getById(orderNumber);
  },
  createOrder: async (data: any) => {
    return OrdersAPI.create(data);
  },
  updateOrderStatus: async (orderNumber: string, status: string) => {
    return OrdersAPI.updateStatus(orderNumber, status);
  }
};
