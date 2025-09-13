import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { CartState, CartItem, Item } from "../types";
import { CONFIG } from "../CONFIG";

// Cart Actions
type CartAction =
  | { type: "ADD_ITEM"; payload: Item }
  | { type: "REMOVE_ITEM"; payload: string } // itemId
  | { type: "UPDATE_QUANTITY"; payload: { itemId: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "SET_CART"; payload: CartItem[] };

// Cart Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find(
        (item) => item.itemId === action.payload.itemId
      );

      let updatedItems: CartItem[];
      if (existingItem) {
        // Increment quantity if item already exists
        updatedItems = state.items.map((item) =>
          item.itemId === action.payload.itemId
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      } else {
        // Add new item to cart
        const newCartItem: CartItem = {
          ...action.payload,
          cartQuantity: 1,
        };
        updatedItems = [...state.items, newCartItem];
      }

      return {
        items: updatedItems,
        total: calculateTotal(updatedItems),
      };
    }

    case "REMOVE_ITEM": {
      const updatedItems = state.items.filter(
        (item) => item.itemId !== action.payload
      );
      return {
        items: updatedItems,
        total: calculateTotal(updatedItems),
      };
    }

    case "UPDATE_QUANTITY": {
      const { itemId, quantity } = action.payload;

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        const updatedItems = state.items.filter(
          (item) => item.itemId !== itemId
        );
        return {
          items: updatedItems,
          total: calculateTotal(updatedItems),
        };
      }

      const updatedItems = state.items.map((item) =>
        item.itemId === itemId ? { ...item, cartQuantity: quantity } : item
      );

      return {
        items: updatedItems,
        total: calculateTotal(updatedItems),
      };
    }

    case "CLEAR_CART":
      return {
        items: [],
        total: 0,
      };

    case "SET_CART": {
      return {
        items: action.payload,
        total: calculateTotal(action.payload),
      };
    }

    default:
      return state;
  }
};

// Helper function to calculate total
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce(
    (total, item) => total + item.price * item.cartQuantity,
    0
  );
};

// Initial state
const initialState: CartState = {
  items: [],
  total: 0,
};

// Cart Context
interface CartContextType {
  state: CartState;
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string) => number;
  getCartItemsCount: () => number;
  getCartTotal: () => number;
  getFormattedTotal: () => string;
  isItemInCart: (itemId: string) => boolean;
  canAddItem: (
    item: Item,
    requestedQuantity?: number
  ) => { canAdd: boolean; reason?: string };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart Provider
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (item: Item) => {
    const { canAdd, reason } = canAddItem(item);
    if (!canAdd) {
      console.warn(`[Cart] Cannot add item: ${reason}`);
      throw new Error(reason);
    }

    dispatch({ type: "ADD_ITEM", payload: item });
    console.log(`[Cart] Added item: ${item.name}`);
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: itemId });
    console.log(`[Cart] Removed item: ${itemId}`);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    const item = state.items.find((cartItem) => cartItem.itemId === itemId);
    if (item) {
      const { canAdd, reason } = canAddItem(item, quantity);
      if (!canAdd && quantity > 0) {
        console.warn(`[Cart] Cannot update quantity: ${reason}`);
        throw new Error(reason);
      }
    }

    dispatch({ type: "UPDATE_QUANTITY", payload: { itemId, quantity } });
    console.log(`[Cart] Updated quantity for ${itemId}: ${quantity}`);
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
    console.log("[Cart] Cart cleared");
  };

  const getItemQuantity = (itemId: string): number => {
    const item = state.items.find((cartItem) => cartItem.itemId === itemId);
    return item ? item.cartQuantity : 0;
  };

  const getCartItemsCount = (): number => {
    return state.items.reduce((count, item) => count + item.cartQuantity, 0);
  };

  const getCartTotal = (): number => {
    return state.total;
  };

  const getFormattedTotal = (): string => {
    return `${CONFIG.CURRENCY}${state.total.toFixed(2)}`;
  };

  const isItemInCart = (itemId: string): boolean => {
    return state.items.some((item) => item.itemId === itemId);
  };

  const canAddItem = (
    item: Item,
    requestedQuantity: number = 1
  ): { canAdd: boolean; reason?: string } => {
    const currentCartQuantity = getItemQuantity(item.itemId);
    const totalRequestedQuantity = currentCartQuantity + requestedQuantity;

    // Check if item is expired
    if (item.expiryDate) {
      const expiryDate = new Date(item.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for date comparison

      if (expiryDate < today) {
        return {
          canAdd: false,
          reason: "Item has expired and cannot be added to cart",
        };
      }
    }

    // Check stock availability
    if (totalRequestedQuantity > item.qty) {
      return {
        canAdd: false,
        reason: `Not enough stock. Available: ${item.qty}, Requested: ${totalRequestedQuantity}`,
      };
    }

    return { canAdd: true };
  };

  const value: CartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
    getCartItemsCount,
    getCartTotal,
    getFormattedTotal,
    isItemInCart,
    canAddItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook to use cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
