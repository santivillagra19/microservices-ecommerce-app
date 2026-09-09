import { api } from './api';
import type { Product } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', sku: 'SKU-001', name: 'MacBook Pro 16"', description: 'Apple M2 Max, 32GB RAM, 1TB SSD. Laptop para desarrollo de alto rendimiento.', price: 2499.99 },
  { id: '2', sku: 'SKU-002', name: 'Teclado Mecánico Keychron K8', description: 'Teclado inalámbrico TKL con switches Gateron Brown y retroiluminación RGB.', price: 99.50 },
  { id: '3', sku: 'SKU-003', name: 'Monitor LG UltraWide 34"', description: 'Monitor curvo WQHD ideal para productividad y programación.', price: 450.00 },
  { id: '4', sku: 'SKU-004', name: 'Mouse Logitech MX Master 3S', description: 'Mouse ergonómico inalámbrico con scroll electromagnético súper rápido.', price: 109.99 },
];

export const productService = {
  getAll: async (): Promise<Product[]> => {
    // Simulamos un retraso de red de 800ms
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_PRODUCTS), 800));
  },
  getById: async (id: string): Promise<Product> => {
    return new Promise((resolve) => {
      const product = MOCK_PRODUCTS.find(p => p.id === id);
      setTimeout(() => resolve(product!), 500);
    });
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
