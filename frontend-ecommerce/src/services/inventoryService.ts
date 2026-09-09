import { api } from './api';
import type { Inventory } from '../types';

const MOCK_INVENTORY: Inventory[] = [
  { id: 'inv-1', sku: 'SKU-001', quantity: 15 },
  { id: 'inv-2', sku: 'SKU-002', quantity: 42 },
  { id: 'inv-3', sku: 'SKU-003', quantity: 0 },
  { id: 'inv-4', sku: 'SKU-004', quantity: 5 },
];

export const inventoryService = {
  getAll: async (): Promise<Inventory[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_INVENTORY), 600));
  },
  checkStock: async (skuCode: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const item = MOCK_INVENTORY.find(i => i.sku === skuCode);
      setTimeout(() => resolve(item ? item.quantity > 0 : false), 300);
    });
  },
  add: async (inventory: Omit<Inventory, 'id'>): Promise<Inventory> => {
    const response = await api.post('/inventory', inventory);
    return response.data;
  },
  update: async (id: string, inventory: Partial<Inventory>): Promise<Inventory> => {
    const response = await api.put(`/inventory/${id}`, inventory);
    return response.data;
  },
  reduceStock: async (sku: string, quantity: number): Promise<void> => {
    await api.put(`/inventory/reduce/${sku}`, { quantity });
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  }
};
