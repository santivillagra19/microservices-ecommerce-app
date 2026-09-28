import { api } from './api';
import type { Product } from '../types';



export const productService = {
  getAll: async (filters?: { search?: string, category?: string, brand?: string, minPrice?: number | string, maxPrice?: number | string }): Promise<Product[]> => {
    const response = await api.get('/product', { params: filters });
    return response.data;
  },
  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/product/${id}`);
    return response.data;
  },
  create: async (product: Omit<Product, 'id'>): Promise<Product> => {
    const response = await api.post('/product', product);
    return response.data;
  },
  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    const response = await api.put(`/product/${id}`, product);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/product/${id}`);
  }
};
