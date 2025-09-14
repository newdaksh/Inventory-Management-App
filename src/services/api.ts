// services/api.ts
import axios, { AxiosInstance } from "axios";
// keep using expo secure store (for native), but provide a fallback for web
import * as SecureStore from "expo-secure-store";
import { CONFIG } from "../CONFIG";

type AdminLoginPayload = { email: string; password: string };
type CustomerLoginPayload = { name: string; email?: string; phone?: string };

let unauthorizedCallback: (() => void) | null = null;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: CONFIG.PROXY_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

// helper to set axios Authorization header
const setAxiosTokenHeader = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};

/**
 * Cross-platform storage helpers:
 * - prefer SecureStore (native)
 * - fallback to localStorage (web)
 */
const storageSet = async (key: string, value: string) => {
  try {
    if (SecureStore && typeof (SecureStore as any).setItemAsync === "function") {
      return await (SecureStore as any).setItemAsync(key, value);
    }
    // fallback to localStorage for web
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return Promise.reject(new Error("No storage available"));
  } catch (err) {
    return Promise.reject(err);
  }
};

const storageGet = async (key: string) => {
  try {
    if (SecureStore && typeof (SecureStore as any).getItemAsync === "function") {
      return await (SecureStore as any).getItemAsync(key);
    }
    if (typeof window !== "undefined" && window.localStorage) {
      return Promise.resolve(window.localStorage.getItem(key));
    }
    return Promise.resolve(null);
  } catch (err) {
    return Promise.reject(err);
  }
};

const storageDelete = async (key: string) => {
  try {
    if (SecureStore && typeof (SecureStore as any).deleteItemAsync === "function") {
      return await (SecureStore as any).deleteItemAsync(key);
    }
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
      return Promise.resolve();
    }
    return Promise.reject(new Error("No storage available"));
  } catch (err) {
    return Promise.reject(err);
  }
};

const apiService = {
  axios: axiosInstance,
  async setUnauthorizedCallback(cb: () => void) {
    unauthorizedCallback = cb;
  },

  // Clear token from storage and axios header
  async clearToken() {
    try {
      await storageDelete(CONFIG.JWT_STORAGE_KEY);
    } catch (err) {
      console.warn("[api] clearToken error", err);
    } finally {
      setAxiosTokenHeader(null);
    }
  },

  // Save token to storage and set axios header
  async setToken(token: string) {
    try {
      await storageSet(CONFIG.JWT_STORAGE_KEY, token);
      setAxiosTokenHeader(token);
    } catch (err) {
      console.warn("[api] setToken error", err);
      // still set header so subsequent requests have the Authorization header
      try {
        setAxiosTokenHeader(token);
      } catch (e) {
        // ignore
      }
    }
  },

  // Admin login: call proxy endpoint which returns token in response
  async adminLogin(payload: AdminLoginPayload) {
    // you already used proxy approach in your project.
    const url = CONFIG.buildProxyUrl("auth/admin/login");
    const resp = await axiosInstance.post(url, payload);
    return resp.data;
  },

  async customerLogin(payload: CustomerLoginPayload) {
    const url = CONFIG.buildProxyUrl("auth/customer/login");
    const resp = await axiosInstance.post(url, payload);
    return resp.data;
  },

  // Try to fetch token from proxy cookie/token endpoint if you have one
  async getStoredTokenFromProxyIfAny() {
    // Optional: if your proxy returns token in a different place
    // attempt to read it here and then store locally
    try {
      const resp = await axiosInstance.get(CONFIG.buildProxyUrl("auth/me"));
      const parsed = resp?.data;
      // If proxy returns a token
      const tokenFound = parsed?.token || parsed?.data?.token || null;
      if (tokenFound) {
        await this.setToken(tokenFound);
        return { token: tokenFound };
      }
      return parsed;
    } catch (err) {
      // ignore
      return null;
    }
  },

  // helper to read stored token (used by initializeAuth)
  async getStoredToken() {
    try {
      const t = await storageGet(CONFIG.JWT_STORAGE_KEY);
      return t;
    } catch (err) {
      console.warn("[api] getStoredToken error", err);
      return null;
    }
  },

  // expose axios instance for other calls
};

export default apiService;
