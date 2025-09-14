// CONFIG.ts
// Update PROXY_BASE to your deployed proxy URL.
// Example for Netlify functions: "https://my-proxy.netlify.app/.netlify/functions/proxy"
export const CONFIG = {
  // Replace with your real proxy URL (no trailing slash)
  PROXY_BASE: "https://proxy-inventory.netlify.app/.netlify/functions/proxy",

  // These are the webhook paths under your N8N_WEBHOOK_URL
  ADMIN_LOGIN_PATH: "auth/admin/login",
  CUSTOMER_LOGIN_PATH: "auth/customer/login",
  INVENTORY_ITEMS: "/inventory/items",
  LOW_STOCK_THRESHOLD: 5, // threshold for low stock warning

  // Currency symbol for display
  CURRENCY: "$",


  // Keys used to store JWT and user type in SecureStore
  JWT_STORAGE_KEY: "APP_JWT",
  USER_TYPE_KEY: "APP_USER_TYPE",

  // Helper to build a full proxy URL with ?path=<webhookPath>
  buildProxyUrl(path: string) {
    const clean = (path || "").toString().replace(/^\/+/, "");
    return `${this.PROXY_BASE}?path=${encodeURIComponent(clean)}`;
  },
};
