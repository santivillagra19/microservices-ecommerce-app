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
  id: number;
  orderNumber: string;
  orderStatus: string;
  email?: string;
  nombre?: string;
  telefono?: string;
  direccionEntrega?: string;
  orderLineItemsList: OrderLineItem[];
  paymentUrl?: string;
  trackingToken?: string;
}

export interface OrderLineItem {
  id: number;
  sku: string;
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



