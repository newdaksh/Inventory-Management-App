// useAuth.tsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { CONFIG } from "../CONFIG";
import { AuthState, User } from "../types";
import apiService from "../services/api";

// Auth Actions
type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | {
      type: "SET_USER";
      payload: { user: User; token: string; userType: "admin" | "customer" };
    }
  | { type: "CLEAR_USER" }
  | { type: "SET_TOKEN"; payload: string };

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_USER":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        userType: action.payload.userType,
        isLoading: false,
      };
    case "SET_TOKEN":
      return { ...state, token: action.payload };
    case "CLEAR_USER":
      return {
        user: null,
        token: null,
        userType: null,
        isLoading: false,
      };
    default:
      return state;
  }
};

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  userType: null,
  isLoading: true,
};

// Auth Context
interface AuthContextType {
  state: AuthState;
  signInAdmin: (email: string, password: string) => Promise<void>;
  signInCustomer: (
    name: string,
    email?: string,
    phone?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentUser: () => User | null;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isCustomer: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up unauthorized callback
  useEffect(() => {
    apiService.setUnauthorizedCallback(() => {
      console.log("[Auth] Unauthorized callback triggered");
      signOut();
    });
  }, []);

  const initializeAuth = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const token = await SecureStore.getItemAsync(CONFIG.JWT_STORAGE_KEY);
      const userType = await SecureStore.getItemAsync(CONFIG.USER_TYPE_KEY);

      if (token && userType) {
        // Decode JWT to get user info (simple approach - in production, validate the token)
        const payload = decodeJWTPayload(token);
        if (payload && payload.role === userType) {
          const user: User = {
            id: payload.sub || payload.id || "unknown",
            name: payload.name || (userType === "admin" ? "Admin" : "Customer"),
            email: payload.email,
            role: payload.role,
          };

          // set axios header for future requests
          await apiService.setToken(token);

          dispatch({
            type: "SET_USER",
            payload: {
              user,
              token,
              userType: userType as "admin" | "customer",
            },
          });
          console.log(`[Auth] Restored ${userType} session from storage`);
        } else {
          // Invalid token, clear storage
          await clearStoredAuth();
          dispatch({ type: "CLEAR_USER" });
        }
      } else {
        dispatch({ type: "CLEAR_USER" });
      }
    } catch (error) {
      console.error("[Auth] Error initializing auth:", error);
      dispatch({ type: "CLEAR_USER" });
    }
  };

  const signInAdmin = async (email: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const response = await apiService.adminLogin({ email, password });

      // ---- Robust token extraction ----
      // possible shapes:
      // 1) { token: "..." }
      // 2) { data: { token: "..." } }
      // 3) resp.data is string token
      // 4) [ { token: "..." } ] (array)
      // 5) resp is string token
      // Always log the response for debugging during dev:
      console.log("[Auth] raw adminLogin response:", response);

      // let token: string | null = null;

      // If apiService.adminLogin returned axios resp.data, it may already be object or a string
      // if (!response) {
      //   token = null;
      // } else if (typeof response === "string") {
      //   token = response;
      // } else if (typeof response === "object") {
      //   // common cases
      //   if ("token" in response && typeof (response as any).token === "string") {
      //     token = (response as any).token;
      //   } else if ("data" in response && response.data && typeof response.data.token === "string") {
      //     token = response.data.token;
      //   } else if (Array.isArray(response) && response.length > 0 && typeof response[0].token === "string") {
      //     token = response[0].token;
      //   } else if (typeof (response as any).result === "string") {
      //     // sometimes wrappers
      //     token = (response as any).result;
      //   } else {
      //     // fallback: stringify so developer can inspect it
      //     console.warn("[Auth] adminLogin returned unknown shape:", response);
      //   }
      // }

      let token: string | null = null;

      // case 1: normal { token: "..." }
      if (response?.token) {
        token = response.token;
      }
      // case 2: n8n proxy wrapper { message: "{\"token\":\"...\"}" }
      else if (typeof response?.message === "string") {
        try {
          const parsed = JSON.parse(response.message);
          if (parsed?.token) {
            token = parsed.token;
          }
        } catch (err) {
          console.warn("[Auth] Failed to parse response.message", err);
        }
      }
      // case 3: n8n proxy wrapper { upstreamBody: "{\"token\":\"...\"}" }
      else if (typeof response?.upstreamBody === "string") {
        try {
          const parsed = JSON.parse(response.upstreamBody);
          if (parsed?.token) {
            token = parsed.token;
          }
        } catch (err) {
          console.warn("[Auth] Failed to parse response.upstreamBody", err);
        }
      }

      // If token still null, check if apiService itself stored a token or proxy endpoint
      if (!token) {
        // try reading stored token (api service cross-platform getter)
        try {
          const stored = await apiService.getStoredToken?.();
          if (stored) {
            console.log("[Auth] Found token in storage:", !!stored);
            token = stored;
          }
        } catch (err) {
          // ignore
        }
      }

      // Final check: sometimes token is returned wrapped in data.token (two-level)
      if (
        !token &&
        response &&
        (response as any).data &&
        typeof (response as any).data === "object"
      ) {
        const maybe = (response as any).data;
        if (typeof maybe.token === "string") token = maybe.token;
      }

      // If we still don't have a token, fail with helpful diagnostic info
      if (!token) {
        console.error(
          "[Auth] Admin sign in error - no token found. Raw response:",
          response
        );
        throw new Error("Invalid admin token received");
      }

      // quick sanity: token looks like JWT? (three parts separated by '.')
      const tokenLooksLikeJWT = token.split && token.split(".").length === 3;
      if (!tokenLooksLikeJWT) {
        console.warn("[Auth] Token doesn't look like JWT. Received:", token);
        // still proceed if you want, or fail — here we fail to avoid incorrect assumptions
        throw new Error("Invalid admin token content");
      }
      // ---- end robust extraction ----

      const payload = decodeJWTPayload(token);

      if (payload && payload.role === "admin") {
        const user: User = {
          id: payload.sub || payload.id || "admin",
          name: payload.name || "Admin",
          email: payload.email || email,
          role: "admin",
        };

        // store token and set axios header
        await apiService.setToken(token);

        // Persist token & user type
        try {
          await SecureStore.setItemAsync(CONFIG.JWT_STORAGE_KEY, token);
          await SecureStore.setItemAsync(CONFIG.USER_TYPE_KEY, "admin");
        } catch (err) {
          // If SecureStore is not available on web, apiService.setToken should have fallen back to localStorage.
          console.warn("[Auth] SecureStore write failed (maybe web).", err);
        }

        dispatch({
          type: "SET_USER",
          payload: { user, token, userType: "admin" },
        });
        console.log("[Auth] Admin signed in successfully (token saved)");
      } else {
        console.error(
          "[Auth] Admin sign in error - token payload invalid:",
          payload
        );
        throw new Error("Invalid admin token content");
      }
    } catch (error: any) {
      dispatch({ type: "SET_LOADING", payload: false });
      console.error(
        "[Auth] Admin sign in error:",
        error?.message || error,
        error
      );
      throw error;
    }
  };

  const signInCustomer = async (
    name: string,
    email?: string,
    phone?: string
  ) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const response = await apiService.customerLogin({ name, email, phone });

      const token = response.token || (response?.data && response.data.token);

      if (!token) {
        throw new Error("Invalid customer token received");
      }

      const payload = decodeJWTPayload(token);

      if (payload && payload.role === "customer") {
        const user: User = {
          id: payload.sub || payload.id || "customer",
          name: payload.name || name,
          email: payload.email || email,
          phone: payload.phone || phone,
          role: "customer",
        };

        await apiService.setToken(token);

        // Persist token & user type so initializeAuth can restore session later
        await SecureStore.setItemAsync(CONFIG.JWT_STORAGE_KEY, token);
        await SecureStore.setItemAsync(CONFIG.USER_TYPE_KEY, "customer");

        dispatch({
          type: "SET_USER",
          payload: { user, token, userType: "customer" },
        });
        console.log("[Auth] Customer signed in successfully (token saved)");
      } else {
        throw new Error("Invalid customer token received");
      }
    } catch (error: any) {
      dispatch({ type: "SET_LOADING", payload: false });
      console.error("[Auth] Customer sign in error:", error?.message || error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await clearStoredAuth();
      dispatch({ type: "CLEAR_USER" });
      console.log("[Auth] User signed out");
    } catch (error) {
      console.error("[Auth] Error signing out:", error);
    }
  };

  const clearStoredAuth = async () => {
    await apiService.clearToken();
    // clear both JWT and user type keys
    try {
      await SecureStore.deleteItemAsync(CONFIG.USER_TYPE_KEY);
      await SecureStore.deleteItemAsync(CONFIG.JWT_STORAGE_KEY);
      console.log("[Auth] Cleared stored auth keys");
    } catch (e) {
      console.warn("[Auth] Error clearing stored auth keys:", e);
    }
  };

  const getCurrentUser = (): User | null => {
    return state.user;
  };

  const isAuthenticated = (): boolean => {
    return !!state.user && !!state.token;
  };

  const isAdmin = (): boolean => {
    return state.user?.role === "admin";
  };

  const isCustomer = (): boolean => {
    return state.user?.role === "customer";
  };

  const value: AuthContextType = {
    state,
    signInAdmin,
    signInCustomer,
    signOut,
    getCurrentUser,
    isAuthenticated,
    isAdmin,
    isCustomer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Utility function to decode JWT payload (client-side only, for UI purposes)
// Utility function to decode JWT payload (client-side only)
const decodeJWTPayload = (token: string): any => {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // base64url -> base64
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (payload.length % 4) payload += "=";

    // decode base64 safely
    let decoded: string;
    if (typeof atob === "function") {
      decoded = atob(payload);
    } else if (typeof Buffer !== "undefined") {
      decoded = Buffer.from(payload, "base64").toString("utf8");
    } else if (typeof globalThis !== "undefined" && (globalThis as any).atob) {
      decoded = (globalThis as any).atob(payload);
    } else {
      // last-resort: fromCharCode
      decoded = decodeURIComponent(
        payload
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
    }

    return JSON.parse(decoded);
  } catch (err) {
    console.error("[Auth] Error decoding JWT:", err);
    return null;
  }
};
