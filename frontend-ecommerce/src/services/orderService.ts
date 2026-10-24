import { api } from './api';
import type { Order } from '../types';

export interface OrderLineItemsRequest {
  sku: string;
  price: number;
  quantity: number;
}

export interface OrderRequest {
  orderLineItemsList: OrderLineItemsRequest[];
  email: string;
  nombre?: string;
  telefono?: string;
  direccionEntrega?: string;
  paymentMethod: string;
}

export type OrderResponse = Order;

export const orderService = {
  create: async (orderRequest: OrderRequest): Promise<OrderResponse> => {
    const response = await api.post('/order', orderRequest);
    return response.data;
  },
  track: async (id: number, trackingToken: string, signal?: AbortSignal): Promise<Order> => {
    const response = await api.get(`/order/${id}/tracking`, {
      headers: { 'X-Order-Token': trackingToken }, signal,
    });
    return response.data;
  },
  getAll: async (): Promise<Order[]> => {
    const response = await api.get('/order/admin');
    return response.data;
  },
  getMine: async (): Promise<Order[]> => {
    const response = await api.get('/order');
    return response.data;
  },
  getById: async (id: string): Promise<Order> => {
    const response = await api.get('/order/' + id);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete('/order/' + id);
  },
  updateStatus: async (orderNumber: string, status: string): Promise<void> => {
    await api.put('/order/' + orderNumber + '/status?status=' + status);
  }
};
