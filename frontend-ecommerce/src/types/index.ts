export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
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
