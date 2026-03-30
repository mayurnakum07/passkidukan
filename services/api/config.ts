// services/api/config.ts
// Centralized API Configuration - Control all API endpoints from here

export const API_CONFIG = {
  // Base URL for all APIs
  BASE_URL: 'https://passkidukaanapi.margerp.com',
  
  // Google Maps Configuration
  GOOGLE_MAPS: {
    API_KEY: 'AIzaSyBulvdhv-w6y-tdPIvzaLJuo8RroDU0EBM',
    // API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    GEOCODING_URL: 'https://maps.googleapis.com/maps/api/geocode/json',
    PLACES_URL: 'https://maps.googleapis.com/maps/api/place',
  },
  
  // API Endpoints - Change these to switch between mock and real APIs
  ENDPOINTS: {
    // Store APIs
    STORE_EXPLORE: '/v1/store/explore/pincode',
    
    // Grocery APIs
    GROCERY_CATEGORIES: '/v1/store/:storeId/category/grocery',
    GROCERY_SUBCATEGORIES: '/v1/store/:storeId/subcategory/grocery',
    GROCERY_PRODUCTS: '/v1/store/:storeId/product/grocery',
    GROCERY_PRODUCT_DETAILS: '/v1/store/:storeId/product/grocery/:productId',
    
    // Pharma APIs
    PHARMA_CATEGORIES: '/v1/store/:storeId/category/pharma',
    PHARMA_SUBCATEGORIES: '/v1/store/:storeId/subcategory/pharma',
    PHARMA_PRODUCTS: '/v1/store/:storeId/product/pharma',
    PHARMA_PRODUCT_DETAILS: '/v1/store/:storeId/product/pharma/:productId',
    
    // Banner APIs
    BANNERS: '/v1/store/:storeId/banners',
    
    // Auth APIs
    LOGIN: '/v1/customer/login',
    REGISTER: '/v1/customer/register',
    SEND_OTP: '/v1/customer/login', // Fixed: Using login endpoint for sending OTP
    VERIFY_OTP: '/v1/customer/verify-otp',
    GET_PROFILE: '/v1/customer/self',
    
    // Address APIs
    ADDRESSES: '/v1/customer/address',
    ADDRESS_BY_ID: '/v1/customer/address/:addressId',
    
    // Cart APIs
    CART: '/v1/customer/cart',
    
    // Order APIs
    ORDERS: '/v1/store/customer/order',
    ORDER_DETAILS: '/v1/customer/orders/:orderId',
    
    // Store Details
    STORE_DETAILS: '/v1/store/details',
    
    // Payment APIs
    PLACE_ORDER: 'https://passkidukaanapi.margerp.com/v1/store/checkout/placeorder',
    INITIATE_PAYMENT: 'https://passkidukaanapi.margerp.com/v1/store/checkout/orderpayment/initiate',
    VERIFY_PAYMENT: 'https://passkidukaanapi.margerp.com/v1/store/checkout/orderpayment/verify',
  },
  
  // Feature Flags - Enable/disable API usage
  FEATURES: {
    USE_REAL_APIS: true,
    USE_REAL_CATEGORIES: true,
    USE_REAL_PRODUCTS: true,
    USE_REAL_BANNERS: true,
    USE_REAL_AUTH: true,
    USE_REAL_ADDRESSES: false,
    USE_REAL_CART: false,
    USE_REAL_ORDERS: false,
  },
  
  // API Timeout settings
  TIMEOUT: 10000, // 10 seconds
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string, params: Record<string, string> = {}): string => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Replace path parameters
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};

// Helper function to check if API feature is enabled
export const isApiEnabled = (feature: keyof typeof API_CONFIG.FEATURES): boolean => {
  return API_CONFIG.FEATURES.USE_REAL_APIS && API_CONFIG.FEATURES[feature];
};

// Helper function to get endpoint
export const getEndpoint = (key: keyof typeof API_CONFIG.ENDPOINTS): string => {
  return API_CONFIG.ENDPOINTS[key];
};

export default API_CONFIG; 