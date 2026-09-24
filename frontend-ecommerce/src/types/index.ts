export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  imageUrls?: string[];
  category?: string;
  brand?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  skuCode: string;
  price: number;
  quantity: number;
}

export interface Inventory {
  id: string;
  sku: string;
  quantity: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}



