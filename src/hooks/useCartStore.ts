"use client";

import { create } from "zustand";
import { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  discount: number;
  paymentType: string;
  orderType: string;
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updatePrice: (productId: number, price: number) => void;
  setDiscount: (discount: number) => void;
  setPaymentType: (type: string) => void;
  setOrderType: (type: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getFinalTotal: () => number;
  getDeliveryFee: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discount: 0,
  paymentType: "cash",
  orderType: "shop",

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity, total: (i.quantity + item.quantity) * i.price }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, quantity, total: quantity * i.price }
          : i
      ),
    }));
  },

  updatePrice: (productId, price) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, price, total: i.quantity * price }
          : i
      ),
    }));
  },

  setDiscount: (discount) => set({ discount }),
  setPaymentType: (type) => set({ paymentType: type }),
  setOrderType: (type) => set({ orderType: type }),
  clearCart: () => set({ items: [], discount: 0, orderType: "shop" }),

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.total, 0);
  },

  getDeliveryFee: () => {
    return get().orderType === "delivery" ? 5 : 0;
  },

  getFinalTotal: () => {
    const deliveryFee = get().getDeliveryFee();
    return Math.max(0, get().getTotal() + deliveryFee - get().discount);
  },
}));