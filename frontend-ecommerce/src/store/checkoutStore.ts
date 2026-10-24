import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Order } from '../types';

interface CheckoutState {
  order: Order | null;
  isGuestOrder: boolean;
  setOrder: (order: Order, isGuestOrder?: boolean) => void;
}

export const useCheckoutStore = create<CheckoutState>()(persist(
  (set) => ({
    order: null,
    isGuestOrder: false,
    setOrder: ({ id, orderNumber, orderStatus, orderLineItemsList, paymentUrl, trackingToken }, isGuestOrder) => set({
      ...(isGuestOrder === undefined ? {} : { isGuestOrder }),
      order: { id, orderNumber, orderStatus, orderLineItemsList, paymentUrl, trackingToken },
    }),
  }),
  { name: 'checkout-order', storage: createJSONStorage(() => sessionStorage) },
));
