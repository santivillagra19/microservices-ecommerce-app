import { api } from './api';
import type { Order } from '../types';

export const orderService = {
  create: async (orderRequest: { skuCode: string; price: number; quantity: number }): Promise<string> => {
    // According to context, returns a string (e.g. "Order Placed Successfully") or similar depending on the exact backend setup, but assuming a simple response.
    const response = await api.post('/order', orderRequest);
    return response.data;
  },
  getAll: async (): Promise<Order[]> => {
    const response = await api.get('/order');
    return response.data;
  },
  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/order/${id}`);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/order/${id}`);
  }
};
