// Production config bundle (client-side)
window.__CIPHERDOCS__ = window.__CIPHERDOCS__ || {};
window.__CIPHERDOCS__.FEATURE_FLAGS = {
  debugMode: true,
  showAdminLinks: false
};
window.__CIPHERDOCS__.INTERNAL_ENDPOINTS = [
  "/api/graphql",
  "/api/v1/internal/admin",
  "/__debug/config",
  "/__debug/users",
  "/__debug/metrics",
  "/__debug/logs",
  "/.well-known/internal-status"
];
window.__CIPHERDOCS__.DEBUG = {
  apiKey: "nvault_debug_2024_internal",
  internalApiKey: "nvk_d56f1953e015cc01e79c84028089135d"
};

