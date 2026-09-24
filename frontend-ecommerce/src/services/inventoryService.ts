import { api } from './api';
import type { Inventory } from '../types';



export const inventoryService = {
  getAll: async (): Promise<Inventory[]> => {
    const response = await api.get('/inventory');
    return response.data;
  },
  checkStock: async (skuCode: string): Promise<boolean> => {
    const response = await api.get(`/inventory`, { params: { skuCode } });
    // Assuming it returns an array of inventory items and we check if there's any with quantity > 0
    const item = response.data.find((i: Inventory) => i.sku === skuCode);
    return item ? item.quantity > 0 : false;
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
