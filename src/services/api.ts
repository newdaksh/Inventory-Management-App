import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { CONFIG } from "../CONFIG";
import {
  Item,
  AuthResponse,
  AdminLoginForm,
  CustomerLoginForm,
  AddItemForm,
  PlaceOrderRequest,
  PlaceOrderResponse,
  ApiError,
} from "../types";

class ApiService {
  private api: AxiosInstance;
  private onUnauthorized?: () => void;

  constructor() {
    this.api = axios.create({
      baseURL: CONFIG.BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add JWT token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await SecureStore.getItemAsync(CONFIG.JWT_STORAGE_KEY);
          if (token) {
            // Add Authorization header with Bearer token as expected by n8n workflow
            config.headers.Authorization = `Bearer ${token}`;
            console.log("[API] Added JWT token to request headers");
          }
        } catch (error) {
          console.error(
            "[API] Error retrieving token from secure store:",
            error
          );
        }
        return config;
      },
      (error) => {
        console.error("[API] Request interceptor error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle 401 errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        console.error(
          "[API] Response error:",
          error?.response?.status,
          error?.response?.data
        );

        if (error?.response?.status === 401) {
          console.log(
            "[API] Unauthorized - clearing token and redirecting to login"
          );
          await this.clearToken();
          if (this.onUnauthorized) {
            this.onUnauthorized();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Set callback for unauthorized errors
  setUnauthorizedCallback(callback: () => void) {
    this.onUnauthorized = callback;
  }

  // Token management
  async saveToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(CONFIG.JWT_STORAGE_KEY, token);
      console.log("[API] Token saved to secure store");
    } catch (error) {
      console.error("[API] Error saving token:", error);
      throw error;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(CONFIG.JWT_STORAGE_KEY);
    } catch (error) {
      console.error("[API] Error retrieving token:", error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(CONFIG.JWT_STORAGE_KEY);
      await SecureStore.deleteItemAsync(CONFIG.USER_TYPE_KEY);
      console.log("[API] Token cleared from secure store");
    } catch (error) {
      console.error("[API] Error clearing token:", error);
    }
  }

  // Auth API calls
  async adminLogin(credentials: AdminLoginForm): Promise<AuthResponse> {
    try {
      console.log(
        "[API] Admin login request to:",
        CONFIG.ENDPOINTS.ADMIN_LOGIN
      );
      const response = await this.api.post<AuthResponse>(
        CONFIG.ENDPOINTS.ADMIN_LOGIN,
        credentials
      );

      if (response.data.token) {
        await this.saveToken(response.data.token);
        await SecureStore.setItemAsync(CONFIG.USER_TYPE_KEY, "admin");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[API] Admin login error:",
        error?.response?.data || error.message
      );
      throw new Error(error?.response?.data?.error || "Login failed");
    }
  }

  async customerLogin(credentials: CustomerLoginForm): Promise<AuthResponse> {
    try {
      console.log(
        "[API] Customer login request to:",
        CONFIG.ENDPOINTS.CUSTOMER_LOGIN
      );
      const response = await this.api.post<AuthResponse>(
        CONFIG.ENDPOINTS.CUSTOMER_LOGIN,
        credentials
      );

      if (response.data.token) {
        await this.saveToken(response.data.token);
        await SecureStore.setItemAsync(CONFIG.USER_TYPE_KEY, "customer");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[API] Customer login error:",
        error?.response?.data || error.message
      );
      throw new Error(error?.response?.data?.error || "Login failed");
    }
  }

  // Inventory API calls (Admin protected)
  async getInventoryItems(): Promise<Item[]> {
    try {
      console.log(
        "[API] Fetching inventory items from:",
        CONFIG.ENDPOINTS.INVENTORY_ITEMS
      );
      const response = await this.api.get<Item[]>(
        CONFIG.ENDPOINTS.INVENTORY_ITEMS
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "[API] Get inventory error:",
        error?.response?.data || error.message
      );
      throw new Error(
        error?.response?.data?.error || "Failed to fetch inventory"
      );
    }
  }

  async addInventoryItem(
    item: AddItemForm
  ): Promise<{ success: boolean; itemId: string }> {
    try {
      console.log(
        "[API] Adding inventory item to:",
        CONFIG.ENDPOINTS.INVENTORY_ITEMS
      );
      const response = await this.api.post(
        CONFIG.ENDPOINTS.INVENTORY_ITEMS,
        item
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "[API] Add item error:",
        error?.response?.data || error.message
      );
      throw new Error(error?.response?.data?.error || "Failed to add item");
    }
  }

  async updateInventoryItem(
    item: Partial<Item> & { itemId: string }
  ): Promise<{ success: boolean }> {
    try {
      console.log("[API] Updating inventory item:", item.itemId);
      const response = await this.api.put(
        CONFIG.ENDPOINTS.INVENTORY_ITEMS,
        item
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "[API] Update item error:",
        error?.response?.data || error.message
      );
      throw new Error(error?.response?.data?.error || "Failed to update item");
    }
  }

  async deleteInventoryItem(itemId: string): Promise<{ success: boolean }> {
    try {
      console.log("[API] Deleting inventory item:", itemId);
      const response = await this.api.delete(CONFIG.ENDPOINTS.INVENTORY_ITEMS, {
        data: { itemId },
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "[API] Delete item error:",
        error?.response?.data || error.message
      );
      throw new Error(error?.response?.data?.error || "Failed to delete item");
    }
  }

  // Orders API (Customer protected)
  async placeOrder(orderData: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    try {
      console.log("[API] Placing order to:", CONFIG.ENDPOINTS.PLACE_ORDER);
      const response = await this.api.post<PlaceOrderResponse>(
        CONFIG.ENDPOINTS.PLACE_ORDER,
        orderData
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "[API] Place order error:",
        error?.response?.data || error.message
      );
      throw new Error(error?.response?.data?.error || "Failed to place order");
    }
  }

  // Utility method for mock data when backend is not available
  getMockInventoryItems(): Item[] {
    return [
      {
        itemId: "mock-1",
        name: "Tea Leaves",
        qty: 25,
        price: 50,
        expiryDate: "2024-12-31",
        description: "Premium black tea leaves",
      },
      {
        itemId: "mock-2",
        name: "Coffee Beans",
        qty: 15,
        price: 120,
        expiryDate: "2024-11-30",
        description: "Arabica coffee beans",
      },
      {
        itemId: "mock-3",
        name: "Sugar",
        qty: 5,
        price: 30,
        expiryDate: "2025-06-15",
        description: "White sugar packets",
      },
    ];
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
