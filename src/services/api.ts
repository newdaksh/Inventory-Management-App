// services/api.ts
// Axios-based API service that calls the proxy and manages token storage
import axios, { AxiosInstance } from "axios";
import * as SecureStore from "expo-secure-store";
import { CONFIG } from "../CONFIG";

type AdminLoginPayload = { email: string; password: string };
type CustomerLoginPayload = { name: string; email?: string; phone?: string };

let unauthorizedCallback: (() => void) | null = null;

const axiosInstance: AxiosInstance = axios.create({
  // we don't set baseURL to n8n; we directly call built proxy URL
  // but setting a base helps for any relative calls.
  baseURL: CONFIG.PROXY_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

// Response interceptor to detect 401 and call unauthorized callback
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      if (error && error.response && error.response.status === 401) {
        if (unauthorizedCallback) {
          unauthorizedCallback();
        }
      }
    } catch (e) {
      // swallow
    }
    return Promise.reject(error);
  }
);

// Helper to parse proxy's response format.
// Proxy returns { ok, status, upstreamBody, upstream... } OR directly { token: "..." }
// We want to extract token (if present) or return original data.
const parseProxyResponse = (data: any) => {
  // If proxy wrapped upstreamBody as string, try parse it
  if (data == null) return { ok: false, parsed: null };

  // If direct token present (no proxy)
  if (data.token) {
    return { ok: true, parsed: data };
  }

  // If proxy wrapper exists
  if (typeof data.upstreamBody === "string") {
    try {
      const p = JSON.parse(data.upstreamBody);
      return { ok: true, parsed: p };
    } catch (err) {
      // Not JSON — return upstreamBody as text
      return { ok: true, parsed: { raw: data.upstreamBody } };
    }
  }

  // If proxy returns upstreamBody already parsed object
  if (data.upstreamBody && typeof data.upstreamBody === "object") {
    return { ok: true, parsed: data.upstreamBody };
  }

  // fallback
  return { ok: true, parsed: data };
};

const setAxiosTokenHeader = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};

const apiService = {
  // Allow app to set unauthorized callback (useAuth uses this)
  setUnauthorizedCallback(cb: () => void) {
    unauthorizedCallback = cb;
  },

  // Clear stored token (SecureStore) and remove header
  async clearToken() {
    try {
      await SecureStore.deleteItemAsync(CONFIG.JWT_STORAGE_KEY);
    } catch (err) {
      // ignore
      console.warn("[api] clearToken error", err);
    }
    setAxiosTokenHeader(null);
  },

  // Save token to SecureStore and set header
  async setToken(token: string) {
    try {
      await SecureStore.setItemAsync(CONFIG.JWT_STORAGE_KEY, token);
      setAxiosTokenHeader(token);
    } catch (err) {
      console.warn("[api] setToken error", err);
    }
  },

  // Admin login - calls proxy which forwards to n8n webhook
  async adminLogin(payload: AdminLoginPayload) {
    const url = CONFIG.buildProxyUrl(CONFIG.ADMIN_LOGIN_PATH);
    const resp = await axiosInstance.post(url, payload);
    const { ok, parsed } = parseProxyResponse(resp.data);

    if (!ok) throw new Error("Bad response from proxy");

    // parsed may be the upstream response object, or contain token
    // Common pattern: n8n respond body { token: "..." }
    if (parsed && parsed.token) {
      // set token in axios headers too for subsequent requests (optional)
      await this.setToken(parsed.token);
      return parsed;
    }

    // If parsed doesn't have token, maybe the proxy returned wrapper where token sits differently.
    // Try to search for token recursively
    const findToken = (obj: any): string | null => {
      if (!obj || typeof obj !== "object") return null;
      if (obj.token && typeof obj.token === "string") return obj.token;
      for (const k of Object.keys(obj)) {
        try {
          const v = obj[k];
          const t = findToken(v);
          if (t) return t;
        } catch (e) {
          // ignore
        }
      }
      return null;
    };

    const tokenFound = findToken(parsed);
    if (tokenFound) {
      await this.setToken(tokenFound);
      return { token: tokenFound };
    }

    // If still no token, return parsed for caller to handle (may contain error)
    return parsed;
  },

  // Customer login (if you use it)
  async customerLogin(payload: CustomerLoginPayload) {
    const url = CONFIG.buildProxyUrl(CONFIG.CUSTOMER_LOGIN_PATH);
    const resp = await axiosInstance.post(url, payload);
    const { ok, parsed } = parseProxyResponse(resp.data);

    if (!ok) throw new Error("Bad response from proxy");

    if (parsed && parsed.token) {
      await this.setToken(parsed.token);
      return parsed;
    }

    const tokenFound = ((): string | null => {
      const findToken = (obj: any): string | null => {
        if (!obj || typeof obj !== "object") return null;
        if (obj.token && typeof obj.token === "string") return obj.token;
        for (const k of Object.keys(obj)) {
          try {
            const v = obj[k];
            const t = findToken(v);
            if (t) return t;
          } catch (e) {}
        }
        return null;
      };
      return findToken(parsed);
    })();

    if (tokenFound) {
      await this.setToken(tokenFound);
      return { token: tokenFound };
    }

    return parsed;
  },

  // Expose axios instance if you need to call other endpoints later
  axios: axiosInstance,
};

export default apiService;
