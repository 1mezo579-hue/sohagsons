"use client";

import { create } from "zustand";
import { CartItem } from "@/types";

export interface Cart {
  id: number;
  name: string;
  items: CartItem[];
  discount: number;
  paymentType: string;
  orderType: string;
  deliveryFee: number;
  selectedCustomer: any;
}

interface CartStore {
  items: CartItem[];
  discount: number;
  paymentType: string;
  orderType: string;
  deliveryFee: number;
  selectedCustomer: any;

  carts: Cart[];
  activeCartId: number;

  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updatePrice: (productId: number, price: number) => void;
  updateProductDetails: (productId: number, name: string, price: number) => void;
  setDiscount: (discount: number) => void;
  setPaymentType: (type: string) => void;
  setOrderType: (type: string) => void;
  setDeliveryFee: (fee: number) => void;
  setSelectedCustomer: (customer: any) => void;
  clearCart: () => void;
  getTotal: () => number;
  getFinalTotal: () => number;
  getDeliveryFee: () => number;

  switchCart: (id: number) => void;
  addCart: () => void;
  removeCart: (id: number) => void;
}

const initialCart = (id: number, name: string): Cart => ({
  id,
  name,
  items: [],
  discount: 0,
  paymentType: "cash",
  orderType: "shop",
  deliveryFee: 5,
  selectedCustomer: null,
});

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discount: 0,
  paymentType: "cash",
  orderType: "shop",
  deliveryFee: 5,
  selectedCustomer: null,

  carts: [initialCart(1, "زبون 1")],
  activeCartId: 1,

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      let newItems = [];
      if (existing) {
        newItems = state.items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity, total: (i.quantity + item.quantity) * i.price }
            : i
        );
      } else {
        newItems = [...state.items, item];
      }

      const updatedCarts = state.carts.map((c) =>
        c.id === state.activeCartId ? { ...c, items: newItems } : c
      );

      return {
        items: newItems,
        carts: updatedCarts,
      };
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.productId !== productId);
      const updatedCarts = state.carts.map((c) =>
        c.id === state.activeCartId ? { ...c, items: newItems } : c
      );
      return {
        items: newItems,
        carts: updatedCarts,
      };
    });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => {
      const newItems = state.items.map((i) =>
        i.productId === productId ? { ...i, quantity, total: quantity * i.price } : i
      );
      const updatedCarts = state.carts.map((c) =>
        c.id === state.activeCartId ? { ...c, items: newItems } : c
      );
      return {
        items: newItems,
        carts: updatedCarts,
      };
    });
  },

  updatePrice: (productId, price) => {
    set((state) => {
      const newItems = state.items.map((i) =>
        i.productId === productId ? { ...i, price, total: i.quantity * price } : i
      );
      const updatedCarts = state.carts.map((c) =>
        c.id === state.activeCartId ? { ...c, items: newItems } : c
      );
      return {
        items: newItems,
        carts: updatedCarts,
      };
    });
  },

  updateProductDetails: (productId, name, price) => {
    set((state) => {
      const newItems = state.items.map((i) =>
        i.productId === productId ? { ...i, name, price, total: i.quantity * price } : i
      );
      const updatedCarts = state.carts.map((c) =>
        c.id === state.activeCartId ? { ...c, items: newItems } : c
      );
      return {
        items: newItems,
        carts: updatedCarts,
      };
    });
  },

  setDiscount: (discount) => {
    set((state) => {
      const updatedCarts = state.carts.map((c) =>
        c.id === state.activeCartId ? { ...c, discount } : c
      );
      return {
        discount,
        carts: updatedCarts,
      };
    });
  },

  setPaymentType: (type) => {
    set((state) => {
      const updatedCarts = state.carts.map((c) =>
        c.id === state.activeCartId ? { ...c, paymentType: type } : c
      );
      return {
        paymentType: type,
        carts: updatedCarts,
      };
    });
  },

  setOrderType: (type) => {
    set((state) => {
      const updatedCarts = state.carts.map((c) =>
        c.id === state.activeCartId ? { ...c, orderType: type } : c
      );
      return {
        orderType: type,
        carts: updatedCarts,
      };
    });
  },

  setDeliveryFee: (fee) => {
    set((state) => {
      const updatedCarts = state.carts.map((c) =>
        c.id === state.activeCartId ? { ...c, deliveryFee: fee } : c
      );
      return {
        deliveryFee: fee,
        carts: updatedCarts,
      };
    });
  },

  setSelectedCustomer: (customer) => {
    set((state) => {
      const updatedCarts = state.carts.map((c) =>
        c.id === state.activeCartId ? { ...c, selectedCustomer: customer } : c
      );
      return {
        selectedCustomer: customer,
        carts: updatedCarts,
      };
    });
  },

  clearCart: () => {
    set((state) => {
      const cleared = initialCart(state.activeCartId, `زبون ${state.activeCartId}`);
      const updatedCarts = state.carts.map((c) =>
        c.id === state.activeCartId ? cleared : c
      );
      return {
        items: [],
        discount: 0,
        paymentType: "cash",
        orderType: "shop",
        deliveryFee: 5,
        selectedCustomer: null,
        carts: updatedCarts,
      };
    });
  },

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.total, 0);
  },

  getDeliveryFee: () => {
    return get().orderType === "delivery" ? get().deliveryFee : 0;
  },

  getFinalTotal: () => {
    const deliveryFee = get().getDeliveryFee();
    return Math.max(0, get().getTotal() + deliveryFee - get().discount);
  },

  switchCart: (id) => {
    set((state) => {
      const target = state.carts.find((c) => c.id === id);
      if (!target) return {};
      return {
        activeCartId: id,
        items: target.items,
        discount: target.discount,
        paymentType: target.paymentType,
        orderType: target.orderType,
        deliveryFee: target.deliveryFee,
        selectedCustomer: target.selectedCustomer,
      };
    });
  },

  addCart: () => {
    set((state) => {
      const nextId = Math.max(...state.carts.map((c) => c.id), 0) + 1;
      const newCart = initialCart(nextId, `زبون ${nextId}`);
      return {
        carts: [...state.carts, newCart],
        activeCartId: nextId,
        items: [],
        discount: 0,
        paymentType: "cash",
        orderType: "shop",
        deliveryFee: 5,
        selectedCustomer: null,
      };
    });
  },

  removeCart: (id) => {
    set((state) => {
      if (state.carts.length <= 1) return {};

      const updatedCarts = state.carts.filter((c) => c.id !== id);
      let newActiveId = state.activeCartId;

      if (state.activeCartId === id) {
        newActiveId = updatedCarts[updatedCarts.length - 1].id;
      }

      const target = updatedCarts.find((c) => c.id === newActiveId)!;

      return {
        carts: updatedCarts,
        activeCartId: newActiveId,
        items: target.items,
        discount: target.discount,
        paymentType: target.paymentType,
        orderType: target.orderType,
        deliveryFee: target.deliveryFee,
        selectedCustomer: target.selectedCustomer,
      };
    });
  },
}));