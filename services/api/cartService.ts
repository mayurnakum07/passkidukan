// services/api/cartService.ts
import apiClient from './client';
import { 
  ApiResponse, 
  Cart, 
  CartItem 
} from './types';

export class CartService {
  // Get user's cart
  async getCart(): Promise<ApiResponse<Cart>> {
    return apiClient.get<Cart>('/cart');
  }

  // Add item to cart
  async addToCart(item: {
    productId: string;
    quantity: number;
    variantId?: string;
    storeId: string;
  }): Promise<ApiResponse<Cart>> {
    return apiClient.post<Cart>('/cart/items', item);
  }

  // Update cart item quantity
  async updateCartItemQuantity(
    itemId: string, 
    quantity: number
  ): Promise<ApiResponse<Cart>> {
    return apiClient.patch<Cart>(`/cart/items/${itemId}`, { quantity });
  }

  // Remove item from cart
  async removeFromCart(itemId: string): Promise<ApiResponse<Cart>> {
    return apiClient.delete<Cart>(`/cart/items/${itemId}`);
  }

  // Clear cart
  async clearCart(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>('/cart');
  }

  // Move item to wishlist
  async moveToWishlist(itemId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/cart/items/${itemId}/move-to-wishlist`);
  }

  // Save cart for later
  async saveCartForLater(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/cart/save-for-later');
  }

  // Get saved cart
  async getSavedCart(): Promise<ApiResponse<Cart>> {
    return apiClient.get<Cart>('/cart/saved');
  }

  // Restore saved cart
  async restoreSavedCart(): Promise<ApiResponse<Cart>> {
    return apiClient.post<Cart>('/cart/restore');
  }

  // Apply coupon to cart
  async applyCoupon(couponCode: string): Promise<ApiResponse<Cart>> {
    return apiClient.post<Cart>('/cart/apply-coupon', { couponCode });
  }

  // Remove coupon from cart
  async removeCoupon(): Promise<ApiResponse<Cart>> {
    return apiClient.delete<Cart>('/cart/coupon');
  }

  // Get available coupons
  async getAvailableCoupons(): Promise<ApiResponse<Array<{
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minimumOrder: number;
    validUntil: string;
  }>>> {
    return apiClient.get<Array<{
      code: string;
      description: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      minimumOrder: number;
      validUntil: string;
    }>>('/cart/available-coupons');
  }

  // Get cart summary
  async getCartSummary(): Promise<ApiResponse<{
    itemCount: number;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    savings: number;
  }>> {
    return apiClient.get<{
      itemCount: number;
      subtotal: number;
      deliveryFee: number;
      discount: number;
      total: number;
      savings: number;
    }>('/cart/summary');
  }

  // Check cart validity
  async checkCartValidity(): Promise<ApiResponse<{
    isValid: boolean;
    issues: Array<{
      type: 'out_of_stock' | 'price_changed' | 'unavailable' | 'minimum_order';
      itemId?: string;
      message: string;
    }>;
  }>> {
    return apiClient.get<{
      isValid: boolean;
      issues: Array<{
        type: 'out_of_stock' | 'price_changed' | 'unavailable' | 'minimum_order';
        itemId?: string;
        message: string;
      }>;
    }>('/cart/validate');
  }

  // Get cart recommendations
  async getCartRecommendations(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    reason: string;
  }>>> {
    return apiClient.get<Array<{
      id: string;
      name: string;
      price: number;
      image: string;
      reason: string;
    }>>('/cart/recommendations');
  }

  // Update cart item variant
  async updateCartItemVariant(
    itemId: string, 
    variantId: string
  ): Promise<ApiResponse<Cart>> {
    return apiClient.patch<Cart>(`/cart/items/${itemId}/variant`, { variantId });
  }

  // Get cart item details
  async getCartItemDetails(itemId: string): Promise<ApiResponse<CartItem>> {
    return apiClient.get<CartItem>(`/cart/items/${itemId}`);
  }

  // Bulk update cart items
  async bulkUpdateCartItems(updates: Array<{
    itemId: string;
    quantity: number;
  }>): Promise<ApiResponse<Cart>> {
    return apiClient.patch<Cart>('/cart/items/bulk-update', { updates });
  }

  // Get cart history
  async getCartHistory(limit: number = 10): Promise<ApiResponse<Array<{
    id: string;
    items: CartItem[];
    total: number;
    createdAt: string;
  }>>> {
    return apiClient.get<Array<{
      id: string;
      items: CartItem[];
      total: number;
      createdAt: string;
    }>>('/cart/history', { limit });
  }

  // Share cart
  async shareCart(): Promise<ApiResponse<{ shareUrl: string; shareCode: string }>> {
    return apiClient.post<{ shareUrl: string; shareCode: string }>('/cart/share');
  }

  // Load shared cart
  async loadSharedCart(shareCode: string): Promise<ApiResponse<Cart>> {
    return apiClient.post<Cart>('/cart/load-shared', { shareCode });
  }

  // Get cart analytics
  async getCartAnalytics(): Promise<ApiResponse<{
    totalItems: number;
    averageOrderValue: number;
    mostAddedItems: Array<{
      productId: string;
      name: string;
      count: number;
    }>;
    cartAbandonmentRate: number;
  }>> {
    return apiClient.get<{
      totalItems: number;
      averageOrderValue: number;
      mostAddedItems: Array<{
        productId: string;
        name: string;
        count: number;
      }>;
      cartAbandonmentRate: number;
    }>('/cart/analytics');
  }

  // Set cart delivery address
  async setCartDeliveryAddress(addressId: string): Promise<ApiResponse<Cart>> {
    return apiClient.post<Cart>('/cart/delivery-address', { addressId });
  }

  // Get cart delivery options
  async getCartDeliveryOptions(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    description: string;
    deliveryTime: string;
    deliveryFee: number;
    isAvailable: boolean;
  }>>> {
    return apiClient.get<Array<{
      id: string;
      name: string;
      description: string;
      deliveryTime: string;
      deliveryFee: number;
      isAvailable: boolean;
    }>>('/cart/delivery-options');
  }

  // Set cart delivery method
  async setCartDeliveryMethod(deliveryMethodId: string): Promise<ApiResponse<Cart>> {
    return apiClient.post<Cart>('/cart/delivery-method', { deliveryMethodId });
  }

  // Get cart delivery slots
  async getCartDeliverySlots(): Promise<ApiResponse<Array<{
    id: string;
    timeSlot: string;
    isAvailable: boolean;
    deliveryFee: number;
  }>>> {
    return apiClient.get<Array<{
      id: string;
      timeSlot: string;
      isAvailable: boolean;
      deliveryFee: number;
    }>>('/cart/delivery-slots');
  }

  // Set cart delivery slot
  async setCartDeliverySlot(slotId: string): Promise<ApiResponse<Cart>> {
    return apiClient.post<Cart>('/cart/delivery-slot', { slotId });
  }
}

// Create singleton instance
export const cartService = new CartService();
export default cartService; 