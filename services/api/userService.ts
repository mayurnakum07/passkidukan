// services/api/userService.ts
import apiClient from './client';
import { 
  ApiResponse, 
  UserProfile, 
  Address, 
  WishlistItem,
  RecentlyBoughtItem,
  Notification,
  PaginatedResponse,
  PaginationParams
} from './types';

export class UserService {
  // Get user profile
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>('/user/profile');
  }

  // Update user profile
  async updateProfile(profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return apiClient.put<UserProfile>('/user/profile', profileData);
  }

  // Update user preferences
  async updatePreferences(preferences: Partial<UserProfile['preferences']>): Promise<ApiResponse<UserProfile>> {
    return apiClient.patch<UserProfile>('/user/preferences', preferences);
  }

  // Upload profile image
  async uploadProfileImage(file: { uri: string; type: string; name: string }): Promise<ApiResponse<{ imageUrl: string }>> {
    return apiClient.uploadFile<{ imageUrl: string }>('/user/profile-image', file);
  }

  // Get user addresses
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    return apiClient.get<Address[]>('/user/addresses');
  }

  // Add new address
  async addAddress(address: Omit<Address, 'id'>): Promise<ApiResponse<Address>> {
    return apiClient.post<Address>('/user/addresses', address);
  }

  // Update address
  async updateAddress(addressId: string, address: Partial<Address>): Promise<ApiResponse<Address>> {
    return apiClient.put<Address>(`/user/addresses/${addressId}`, address);
  }

  // Delete address
  async deleteAddress(addressId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/user/addresses/${addressId}`);
  }

  // Set default address
  async setDefaultAddress(addressId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/user/addresses/${addressId}/set-default`);
  }

  // Get wishlist
  async getWishlist(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<WishlistItem>>> {
    return apiClient.get<PaginatedResponse<WishlistItem>>('/user/wishlist', params);
  }

  // Add to wishlist
  async addToWishlist(productId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/user/wishlist', { productId });
  }

  // Remove from wishlist
  async removeFromWishlist(wishlistItemId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/user/wishlist/${wishlistItemId}`);
  }

  // Move wishlist item to cart
  async moveWishlistToCart(wishlistItemId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/user/wishlist/${wishlistItemId}/move-to-cart`);
  }

  // Clear wishlist
  async clearWishlist(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>('/user/wishlist');
  }

  // Get recently bought items
  async getRecentlyBought(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<RecentlyBoughtItem>>> {
    return apiClient.get<PaginatedResponse<RecentlyBoughtItem>>('/user/recently-bought', params);
  }

  // Get saved products
  async getSavedProducts(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<WishlistItem>>> {
    return apiClient.get<PaginatedResponse<WishlistItem>>('/user/saved-products', params);
  }

  // Get notifications
  async getNotifications(params?: PaginationParams & { isRead?: boolean }): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    return apiClient.get<PaginatedResponse<Notification>>('/user/notifications', params);
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch<{ message: string }>(`/user/notifications/${notificationId}/read`);
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch<{ message: string }>('/user/notifications/mark-all-read');
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/user/notifications/${notificationId}`);
  }

  // Get notification settings
  async getNotificationSettings(): Promise<ApiResponse<{
    push: boolean;
    email: boolean;
    sms: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    newProducts: boolean;
    priceDrops: boolean;
    deliveryUpdates: boolean;
  }>> {
    return apiClient.get<{
      push: boolean;
      email: boolean;
      sms: boolean;
      orderUpdates: boolean;
      promotions: boolean;
      newProducts: boolean;
      priceDrops: boolean;
      deliveryUpdates: boolean;
    }>('/user/notification-settings');
  }

  // Update notification settings
  async updateNotificationSettings(settings: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
    orderUpdates?: boolean;
    promotions?: boolean;
    newProducts?: boolean;
    priceDrops?: boolean;
    deliveryUpdates?: boolean;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch<{ message: string }>('/user/notification-settings', settings);
  }

  // Get user statistics
  async getUserStatistics(): Promise<ApiResponse<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    wishlistItems: number;
    savedProducts: number;
    unreadNotifications: number;
    memberSince: string;
    loyaltyPoints: number;
    loyaltyTier: string;
  }>> {
    return apiClient.get<{
      totalOrders: number;
      totalSpent: number;
      averageOrderValue: number;
      wishlistItems: number;
      savedProducts: number;
      unreadNotifications: number;
      memberSince: string;
      loyaltyPoints: number;
      loyaltyTier: string;
    }>('/user/statistics');
  }

  // Get loyalty points
  async getLoyaltyPoints(): Promise<ApiResponse<{
    currentPoints: number;
    lifetimePoints: number;
    tier: string;
    nextTier: string;
    pointsToNextTier: number;
    history: Array<{
      id: string;
      type: 'earned' | 'redeemed' | 'expired';
      points: number;
      description: string;
      date: string;
    }>;
  }>> {
    return apiClient.get<{
      currentPoints: number;
      lifetimePoints: number;
      tier: string;
      nextTier: string;
      pointsToNextTier: number;
      history: Array<{
        id: string;
        type: 'earned' | 'redeemed' | 'expired';
        points: number;
        description: string;
        date: string;
      }>;
    }>('/user/loyalty-points');
  }

  // Get available rewards
  async getAvailableRewards(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    description: string;
    pointsRequired: number;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minimumOrder: number;
    validUntil: string;
    isAvailable: boolean;
  }>>> {
    return apiClient.get<Array<{
      id: string;
      name: string;
      description: string;
      pointsRequired: number;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      minimumOrder: number;
      validUntil: string;
      isAvailable: boolean;
    }>>('/user/available-rewards');
  }

  // Redeem reward
  async redeemReward(rewardId: string): Promise<ApiResponse<{ 
    message: string; 
    couponCode: string; 
    pointsUsed: number; 
  }>> {
    return apiClient.post<{ 
      message: string; 
      couponCode: string; 
      pointsUsed: number; 
    }>('/user/redeem-reward', { rewardId });
  }

  // Get privacy settings
  async getPrivacySettings(): Promise<ApiResponse<{
    profileVisibility: 'public' | 'private';
    shareOrderHistory: boolean;
    shareWishlist: boolean;
    allowPersonalization: boolean;
    allowAnalytics: boolean;
  }>> {
    return apiClient.get<{
      profileVisibility: 'public' | 'private';
      shareOrderHistory: boolean;
      shareWishlist: boolean;
      allowPersonalization: boolean;
      allowAnalytics: boolean;
    }>('/user/privacy-settings');
  }

  // Update privacy settings
  async updatePrivacySettings(settings: {
    profileVisibility?: 'public' | 'private';
    shareOrderHistory?: boolean;
    shareWishlist?: boolean;
    allowPersonalization?: boolean;
    allowAnalytics?: boolean;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch<{ message: string }>('/user/privacy-settings', settings);
  }

  // Export user data
  async exportUserData(): Promise<ApiResponse<{ downloadUrl: string; expiresAt: string }>> {
    return apiClient.post<{ downloadUrl: string; expiresAt: string }>('/user/export-data');
  }

  // Delete user account
  async deleteAccount(reason?: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.request<{ message: string }>({
      method: 'DELETE',
      url: '/user/account',
      data: reason ? { reason } : undefined,
    });
  }

  // Get account activity
  async getAccountActivity(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<{
    id: string;
    type: 'login' | 'order' | 'profile_update' | 'address_update' | 'password_change';
    description: string;
    timestamp: string;
    ipAddress?: string;
    deviceInfo?: string;
  }>>> {
    return apiClient.get<PaginatedResponse<{
      id: string;
      type: 'login' | 'order' | 'profile_update' | 'address_update' | 'password_change';
      description: string;
      timestamp: string;
      ipAddress?: string;
      deviceInfo?: string;
    }>>('/user/account-activity', params);
  }

  // Get connected devices
  async getConnectedDevices(): Promise<ApiResponse<Array<{
    id: string;
    deviceName: string;
    deviceType: string;
    lastActive: string;
    isCurrent: boolean;
  }>>> {
    return apiClient.get<Array<{
      id: string;
      deviceName: string;
      deviceType: string;
      lastActive: string;
      isCurrent: boolean;
    }>>('/user/connected-devices');
  }

  // Revoke device access
  async revokeDeviceAccess(deviceId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/user/connected-devices/${deviceId}`);
  }
}

// Create singleton instance
export const userService = new UserService();
export default userService; 