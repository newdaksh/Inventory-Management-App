// TypeScript interfaces for the inventory management app

export interface Item {
  itemId: string;
  name: string;
  qty: number;
  price: number;
  photoUrl?: string;
  expiryDate?: string; // ISO date string (YYYY-MM-DD)
  description?: string;
}

export interface CartItem extends Item {
  cartQuantity: number;
}

export interface Order {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  bill: string;
  createdAt: string;
  paymentMethod?: string;
  status?: "pending" | "completed" | "cancelled";
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: "admin" | "customer";
}

export interface AuthResponse {
  token: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

// Form interfaces
export interface AdminLoginForm {
  email: string;
  password: string;
}

export interface CustomerLoginForm {
  name: string;
  email?: string;
  phone?: string;
}

export interface AddItemForm {
  name: string;
  qty: number;
  price: number;
  expiryDate?: string;
  photoBase64?: string;
  description?: string;
}

export interface PlaceOrderRequest {
  items: OrderItem[];
  paymentMethod?: string;
}

export interface PlaceOrderResponse {
  orderId: string;
  totalAmount: number;
  bill: string;
}

// Navigation types
export type RootStackParamList = {
  AuthStack: undefined;
  AdminStack: undefined;
  CustomerStack: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  AdminLogin: undefined;
  CustomerLogin: undefined;
};

export type AdminStackParamList = {
  AdminDrawer: undefined;
};

export type AdminDrawerParamList = {
  Dashboard: undefined;
  Inventory: undefined;
  Orders: undefined;
  Settings: undefined;
};

export type CustomerStackParamList = {
  ItemsList: undefined;
  Cart: undefined;
  OrderSuccess: { order: PlaceOrderResponse };
};

export type InventoryStackParamList = {
  InventoryList: undefined;
  AddEditItem: { item?: Item; mode: "add" | "edit" };
};

// App state types
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  userType: "admin" | "customer" | null;
}

export interface CartState {
  items: CartItem[];
  total: number;
}

export interface InventoryState {
  items: Item[];
  isLoading: boolean;
  error: string | null;
}
