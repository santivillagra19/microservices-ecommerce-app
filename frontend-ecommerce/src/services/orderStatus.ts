export type OrderViewStatus = 'PLACED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export const isOrderConfirmed = (status: string) =>
  ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status.toUpperCase());

export const statusFromApi = (status: string): OrderViewStatus => {
  switch (String(status || '').toUpperCase()) {
    case 'CONFIRMED':
    case 'PROCESSING': return 'PROCESSING';
    case 'SHIPPED': return 'SHIPPED';
    case 'DELIVERED': return 'DELIVERED';
    case 'CANCELLED': return 'CANCELLED';
    default: return 'PLACED';
  }
};
