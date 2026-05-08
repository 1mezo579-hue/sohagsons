export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  priceType: string;
  total: number;
}

export interface ProductFormData {
  name: string;
  barcode?: string;
  categoryId: number;
  priceType: "unit" | "weight";
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string;
}

export interface StockLogFormData {
  productId: number;
  type: "in" | "out";
  quantity: number;
  reason: string;
  notes?: string;
}

export type UserRole = "admin" | "cashier" | "manager";