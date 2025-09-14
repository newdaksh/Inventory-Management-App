// Configuration for API endpoints and app settings
export const CONFIG = {
  // Change this to your n8n webhook base URL
  BASE_URL: "https://n8n.dakshjain.me/webhook-test",

  // For local development, uncomment below:
  // BASE_URL: 'http://localhost:5678/webhook',

  // Mock mode - set to true to use mock data when backend is not available
  MOCK_MODE: false,

  // API endpoints (matching n8n workflow webhook paths)
  ENDPOINTS: {
    ADMIN_LOGIN: "/auth/admin/login",
    CUSTOMER_LOGIN: "/auth/customer/login",
    INVENTORY_ITEMS: "/inventory/items",
    PLACE_ORDER: "/orders/place",
  },

  // JWT storage key
  JWT_STORAGE_KEY: "inventory_app_jwt",
  USER_TYPE_KEY: "inventory_app_user_type",

  // App constants
  CURRENCY: "$",
  LOW_STOCK_THRESHOLD: 10,
};
