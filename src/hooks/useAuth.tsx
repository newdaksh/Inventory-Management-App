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
      // response should contain token property when successful
      const token = response.token || (response?.data && response.data.token);

      if (!token) {
        throw new Error("Invalid admin token received");
      }

      const payload = decodeJWTPayload(token);

      if (payload && payload.role === "admin") {
        const user: User = {
          id: payload.sub || payload.id || "admin",
          name: payload.name || "Admin",
          email: payload.email || email,
          role: "admin",
        };

        // store token and set axios header (apiService already stored it in adminLogin but double-set is ok)
        await apiService.setToken(token);

        dispatch({
          type: "SET_USER",
          payload: { user, token, userType: "admin" },
        });
        console.log("[Auth] Admin signed in successfully");
      } else {
        throw new Error("Invalid admin token content");
      }
    } catch (error: any) {
      dispatch({ type: "SET_LOADING", payload: false });
      console.error("[Auth] Admin sign in error:", error?.message || error);
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

        dispatch({
          type: "SET_USER",
          payload: { user, token, userType: "customer" },
        });
        console.log("[Auth] Customer signed in successfully");
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
    // also clear user type key
    try {
      await SecureStore.deleteItemAsync(CONFIG.USER_TYPE_KEY);
    } catch (e) {
      // ignore
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
const decodeJWTPayload = (token: string): any => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const payload = parts[1];
    // Add padding if necessary
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);

    // atob may not be available in all RN environments; if not, you can add a small base64 decode helper.
    const decoded = typeof atob === "function" ? atob(paddedPayload) : Buffer.from(paddedPayload, "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch (error) {
    console.error("[Auth] Error decoding JWT:", error);
    return null;
  }
};
