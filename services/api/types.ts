// services/api/types.ts
// Comprehensive type definitions for the e-commerce app

// Base API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}


// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User related types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  mobileVerified: boolean;
  emailVerified: boolean;
  image: string | null;
  customerId: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  success: boolean;
  data: {
    status: string;
      token: string; 
  } & User;
}


export interface UserProfile extends User {
  addresses: Address[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
}

// Address types
export interface Address {
  id: string;
  type: 'home' | 'work' | 'friends' | 'other';
  name: string;
  houseNumber: string;
  apartment: string;
  directions: string;
  voiceDirections?: string;
  isDefault: boolean;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

// Store types
export interface Store {
  id: string;
  name: string;
  type: 'grocery' | 'pharma';
  address: string;
  distance: string;
  rating: number;
  image?: string;
  totalItems?: number;
  isOpen: boolean;
  deliveryTime: string;
  minimumOrder: number;
  deliveryFee: number;
  categories: string[];
}

export interface StoreDetail extends Store {
  description: string;
  contactNumber: string;
  email: string;
  workingHours: {
    open: string;
    close: string;
    isOpen: boolean;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  images: string[];
  reviews: StoreReview[];
}

export interface StoreReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  description?: string;
  brand?: string;
  category: 'grocery' | 'pharma';
  subCategory?: string;
  availableQty: number;
  unit: string;
  weight?: string;
  expiryDate?: string;
  isAvailable: boolean;
  isOnSale: boolean;
  discountPercentage?: number;
  rating?: number;
  reviewCount?: number;
  variants?: ProductVariant[];
  tags?: string[];
  nutritionalInfo?: NutritionalInfo;
  prescriptionRequired?: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
}

export interface ExtendedProduct extends Product {
  similarProducts?: Product[];
  reviews?: ProductReview[];
  specifications?: Record<string, string>;
}

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  images?: string[];
}

// Category types
export interface Category {
  id: string;
  name: string;
  image: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  image?: string;
  description?: string;
  parentCategoryId?: string;
  products: Product[];
  brands?: string[];
}

// Cart types
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  category: 'grocery' | 'pharma';
  variant?: {
    id: string;
    name: string;
    unit: string;
  };
  storeId: string;
  availableQty: number;
}

export interface Cart {
  items: CartItem[];
  storeId: string;
  storeName: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  itemCount: number;
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  status: OrderStatus;
  orderType: 'Home Delivery' | 'Store Pickup';
  address: Address;
  orderDate: string;
  deliveryDate?: string;
  itemTotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  paymentMode: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: {
    name: string;
    unit: string;
  };
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

// Search types
export interface SearchParams {
  query: string;
  category?: string;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  sortBy?: 'price' | 'name' | 'rating' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  products: Product[];
  categories: Category[];
  brands: string[];
  totalResults: number;
}

// Banner types
export interface Banner {
  id: string;
  title: string;
  description?: string;
  image: string;
  link: string;
  linkType: 'product' | 'category' | 'store' | 'external';
  isActive: boolean;
  startDate: string;
  endDate: string;
  priority: number;
}

// Wishlist types
export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: string;
}

// Recently bought types
export interface RecentlyBoughtItem {
  id: string;
  productId: string;
  product: Product;
  lastBoughtAt: string;
  quantity: number;
}

// Payment types
export interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod';
  name: string;
  icon: string;
  isAvailable: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  paymentMethod: string;
}

// Delivery types
export interface DeliverySlot {
  id: string;
  timeSlot: string;
  isAvailable: boolean;
  deliveryFee: number;
}

export interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  deliveryTime: string;
  deliveryFee: number;
  isAvailable: boolean;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'system';
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

// Filter types
export interface FilterOptions {
  categories: Category[];
  brands: string[];
  priceRange: {
    min: number;
    max: number;
  };
  ratings: number[];
}

export interface AppliedFilters {
  categories?: string[];
  brands?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  availability?: 'in_stock' | 'out_of_stock' | 'all';
}

// API Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Location types
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
}

// Store selection types
export interface StoreSelectionParams {
  pincode: string;
  location?: Location;
  category?: 'grocery' | 'pharma';
}

// Auth types
// export interface AuthResponse {
//   data: any;
//   // data: any;
//   user: User;
//   token: string;
//   refreshToken: string;
//   otpKey?: string; // Add otpKey for OTP verification
// }

export interface LoginRequest {
  phone: string;
  otp: string;
}

export interface SendOTPRequest {
  phone: string;
}

// App configuration types
export interface AppConfig {
  version: string;
  minimumVersion: string;
  features: {
    voiceSearch: boolean;
    darkMode: boolean;
    notifications: boolean;
  };
  apiEndpoints: {
    baseUrl: string;
    timeout: number;
  };
} 