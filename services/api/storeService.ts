// services/api/storeService.ts
import apiClient from "./client";
import {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  StoreDetail,
} from "./types";

// Define Location type if not already imported
export type Location = {
  latitude: number;
  longitude: number;
};

export type Store = {
  id: string;
  name: string;
  type: "grocery" | "pharma";
  address: string;
  pincode: string;
  rating: number;
  image?: string;
  isOpen: boolean;
  deliveryTime?: string;
  minimumOrder?: number;
  email?: string;
  mobile?: number | string;
  storeId?: string;
  distance?: number;
  isActive?: boolean;
  status?: string;
};

export class StoreService {
  // Get stores by pincode
  async getStoresByPincode(
    pincode: string,
    category?: "grocery" | "pharma",
  ): Promise<ApiResponse<Store[]>> {
    const params: Record<string, any> = { pincode };
    if (category) {
      params.category = category;
    }
    return apiClient.get<Store[]>("/stores/by-pincode", params);
  }

  // Get stores by location
  async getStoresByLocation(
    location: Location,
    category?: "grocery" | "pharma",
  ): Promise<ApiResponse<Store[]>> {
    const params: Record<string, any> = {
      latitude: location.latitude,
      longitude: location.longitude,
    };
    if (category) {
      params.category = category;
    }
    return apiClient.get<Store[]>("/stores/by-location", params);
  }

  // Get store details
  async getStoreDetails(storeId: string): Promise<ApiResponse<StoreDetail>> {
    return apiClient.get<StoreDetail>(`/stores/${storeId}`);
  }

  // Get store by ID (alias for getStoreDetails for deep linking)
  async getStoreById(storeId: string): Promise<ApiResponse<StoreDetail>> {
    return this.getStoreDetails(storeId);
  }

  // Get nearby stores
  async getNearbyStores(
    latitude: number,
    longitude: number,
    radius: number = 5,
  ): Promise<ApiResponse<Store[]>> {
    return apiClient.get<Store[]>("/stores/nearby", {
      latitude,
      longitude,
      radius,
    });
  }

  // Search stores
  async searchStores(
    query: string,
    location?: Location,
  ): Promise<ApiResponse<Store[]>> {
    const params: Record<string, any> = { query };
    if (location) {
      params.latitude = location.latitude;
      params.longitude = location.longitude;
    }
    return apiClient.get<Store[]>("/stores/search", params);
  }

  // Search products within a store (supports pagination)
  async searchStoreProducts(
    storeId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<
    ApiResponse<{
      categories: any[];
      subcategories: any[];
      products: any[];
    }>
  > {
    return apiClient.get(`/v1/store/${storeId}/search`, {
      searchTerm,
      page,
      limit,
    });
  }

  async getCategoryDetails(
    storeId: string,
    categoryId: string,
  ): Promise<
    ApiResponse<{
      subcategories: any[];
      products: any[];
    }>
  > {
    // Try the original endpoint first
    return apiClient.get(`/v1/store/${storeId}/category/${categoryId}`);
  }

  // Get all categories for a store
  async getStoreCategories(
    storeId: string,
    type: "pharma" | "grocery",
  ): Promise<ApiResponse<any[]>> {
    try {
      // First fetch to get total count
      const firstResponse = await apiClient.get<any>(
        `/v1/store/${storeId}/category/${type}`,
        { limit: 100, page: 1 },
      );
      const raw = firstResponse.data;

      // Check if pagination is needed
      const totalCount = raw?.count || 0;
      const currentData = Array.isArray(raw?.data) ? raw.data : [];
      let allCategories = [...currentData];

      // If there are more categories, fetch remaining pages
      if (totalCount > currentData.length) {
        const itemsPerPage = currentData.length || 10;
        const totalPages = Math.ceil(totalCount / itemsPerPage);

        console.log(
          `📦 Fetching ${totalPages} pages of ${type} categories (total: ${totalCount})`,
        );

        // Fetch remaining pages
        for (let page = 2; page <= totalPages; page++) {
          try {
            const pageResponse = await apiClient.get<any>(
              `/v1/store/${storeId}/category/${type}`,
              { limit: itemsPerPage, page },
            );
            const pageData = pageResponse.data;
            if (Array.isArray(pageData?.data)) {
              allCategories = [...allCategories, ...pageData.data];
            }
          } catch (pageError) {
            console.log(`  Error fetching page ${page}:`, pageError);
            // Continue with other pages even if one fails
          }
        }
      }

      console.log(
        `📦 ${type} categories fetched: ${allCategories.length} out of ${totalCount} total`,
      );
      return { success: true, data: allCategories } as ApiResponse<any[]>;
    } catch (error) {
      console.log(`  Error fetching ${type} categories:`, error);
      // Fallback to single page fetch
      return apiClient.get(`/v1/store/${storeId}/category/${type}`);
    }
  }

  // Get subcategories for a specific category
  // NOTE: Backend expects categoryId in filters[categoryId] query param, NOT as part of the store path segment.
  async getCategorySubcategories(
    categoryId: string,
    type: "pharma" | "grocery" = "pharma",
    storeId?: string,
  ): Promise<ApiResponse<any[]>> {
    // When storeId is known, use the proper store path; otherwise fall back to generic
    if (storeId) {
      return apiClient.get(`/v1/store/${storeId}/subcategory/${type}`, {
        "filters[categoryId]": categoryId,
      });
    }

    // Fallback: hit type-specific subcategory endpoint with filters[categoryId]
    return apiClient.get(`/v1/store/${type}/subcategory`, {
      "filters[categoryId]": categoryId,
    });
  }

  // Get stores with pagination
  async getStores(
    params: PaginationParams & { category?: "grocery" | "pharma" },
  ): Promise<ApiResponse<PaginatedResponse<Store>>> {
    return apiClient.get<PaginatedResponse<Store>>("/stores", params);
  }

  // Get store reviews
  async getStoreReviews(
    storeId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ApiResponse<PaginatedResponse<StoreDetail["reviews"][0]>>> {
    return apiClient.get<PaginatedResponse<StoreDetail["reviews"][0]>>(
      `/stores/${storeId}/reviews`,
      { page, limit },
    );
  }

  // Add store review
  async addStoreReview(
    storeId: string,
    rating: number,
    comment: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/stores/${storeId}/reviews`, {
      rating,
      comment,
    });
  }

  // Get store working hours
  async getStoreWorkingHours(
    storeId: string,
  ): Promise<ApiResponse<StoreDetail["workingHours"]>> {
    return apiClient.get<StoreDetail["workingHours"]>(
      `/stores/${storeId}/working-hours`,
    );
  }

  // Check store availability
  async checkStoreAvailability(
    storeId: string,
  ): Promise<ApiResponse<{ isOpen: boolean; nextOpenTime?: string }>> {
    return apiClient.get<{ isOpen: boolean; nextOpenTime?: string }>(
      `/stores/${storeId}/availability`,
    );
  }

  // Get store delivery options
  async getStoreDeliveryOptions(storeId: string): Promise<
    ApiResponse<{
      deliveryMethods: Array<{
        id: string;
        name: string;
        description: string;
        deliveryTime: string;
        deliveryFee: number;
        minimumOrder: number;
      }>;
    }>
  > {
    return apiClient.get<{
      deliveryMethods: Array<{
        id: string;
        name: string;
        description: string;
        deliveryTime: string;
        deliveryFee: number;
        minimumOrder: number;
      }>;
    }>(`/stores/${storeId}/delivery-options`);
  }

  // Get store contact information
  async getStoreContactInfo(storeId: string): Promise<
    ApiResponse<{
      phone: string;
      email: string;
      address: string;
      location: { latitude: number; longitude: number };
    }>
  > {
    return apiClient.get<{
      phone: string;
      email: string;
      address: string;
      location: { latitude: number; longitude: number };
    }>(`/stores/${storeId}/contact`);
  }

  // Get store images
  async getStoreImages(
    storeId: string,
  ): Promise<ApiResponse<{ images: string[] }>> {
    return apiClient.get<{ images: string[] }>(`/stores/${storeId}/images`);
  }

  // Get store statistics
  async getStoreStats(storeId: string): Promise<
    ApiResponse<{
      totalProducts: number;
      totalOrders: number;
      averageRating: number;
      totalReviews: number;
      deliveryTime: string;
    }>
  > {
    return apiClient.get<{
      totalProducts: number;
      totalOrders: number;
      averageRating: number;
      totalReviews: number;
      deliveryTime: string;
    }>(`/stores/${storeId}/stats`);
  }

  // Get popular stores
  async getPopularStores(
    category?: "grocery" | "pharma",
    limit: number = 10,
  ): Promise<ApiResponse<Store[]>> {
    const params: Record<string, any> = { limit };
    if (category) {
      params.category = category;
    }
    return apiClient.get<Store[]>("/stores/popular", params);
  }

  // Get trending stores
  async getTrendingStores(
    category?: "grocery" | "pharma",
    limit: number = 10,
  ): Promise<ApiResponse<Store[]>> {
    const params: Record<string, any> = { limit };
    if (category) {
      params.category = category;
    }
    return apiClient.get<Store[]>("/stores/trending", params);
  }

  // Get store recommendations
  async getStoreRecommendations(
    userId: string,
    limit: number = 10,
  ): Promise<ApiResponse<Store[]>> {
    return apiClient.get<Store[]>("/stores/recommendations", { userId, limit });
  }

  // Follow/unfollow store
  async toggleStoreFollow(
    storeId: string,
  ): Promise<ApiResponse<{ isFollowing: boolean }>> {
    return apiClient.post<{ isFollowing: boolean }>(
      `/stores/${storeId}/follow`,
    );
  }

  // Get followed stores
  async getFollowedStores(): Promise<ApiResponse<Store[]>> {
    return apiClient.get<Store[]>("/stores/followed");
  }

  // Get store notifications settings
  async getStoreNotificationSettings(storeId: string): Promise<
    ApiResponse<{
      orderUpdates: boolean;
      promotions: boolean;
      newProducts: boolean;
    }>
  > {
    return apiClient.get<{
      orderUpdates: boolean;
      promotions: boolean;
      newProducts: boolean;
    }>(`/stores/${storeId}/notification-settings`);
  }

  // Update store notifications settings
  async updateStoreNotificationSettings(
    storeId: string,
    settings: {
      orderUpdates?: boolean;
      promotions?: boolean;
      newProducts?: boolean;
    },
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch<{ message: string }>(
      `/stores/${storeId}/notification-settings`,
      settings,
    );
  }

  async exploreStores(
    pincode: string,
    type?: "grocery" | "pharma",
  ): Promise<ApiResponse<Store[]>> {
    try {
      console.log("🏪 Fetching stores for pincode:", pincode, "type:", type);
      // API expects pincode in header: x-pincode; keep type as query param
      const response = await apiClient.get<Store[]>(
        "/v1/store/explore/pincode",
        { ...(type ? { type } : {}) },
        {
          headers: { "x-pincode": pincode },
        },
      );

      console.log(" Stores API Response:", JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.log("  Stores API Error:", error.response?.data || error.message);
      return {
        success: false,
        error: "Failed to fetch stores. Please try again.",
        data: null as any,
      };
    }
  }

  async exploreStoresByLocation(
    latitude: number,
    longitude: number,
    type?: "grocery" | "pharma",
  ): Promise<ApiResponse<Store[]>> {
    const apiUrl = `https://passkidukaanapi.margerp.com/v1/store/explore/location?latitude=${latitude}&longitude=${longitude}${type ? `&type=${type}` : ""}`;

    console.log("🏪 ========== Store Explore Location API Call ==========");
    console.log("📍 Request Details:");
    console.log("   URL:", apiUrl);
    console.log("   Method: GET");
    console.log(
      "   Params:",
      JSON.stringify({ latitude, longitude, type }, null, 2),
    );

    try {
      // Use the new location-based API endpoint
      const response = await apiClient.get<Store[]>(
        "/v1/store/explore/location",
        {
          latitude,
          longitude,
          ...(type ? { type } : {}),
        },
      );

      // Log response whether success or failure
      if (response.success) {
        console.log("✅ API Call Successful - Response Received:");
        console.log("   Success:", response.success);
        console.log(
          "   Response Data:",
          JSON.stringify(response.data, null, 2),
        );
        console.log("   Full Response:", JSON.stringify(response, null, 2));
      } else {
        console.log("⚠️ API Hit But Returned Error Response:");
        console.log("   Success:", response.success);
        console.log("   Error Message:", response.error);
        console.log(
          "   Response Data:",
          JSON.stringify(response.data, null, 2),
        );
        console.log("   Full Response:", JSON.stringify(response, null, 2));
      }
      console.log("🏪 ====================================================");

      return response;
    } catch (error: any) {
      // Check if API was hit or not
      if (error.response) {
        // API was hit and returned a response (even if error status)
        console.log("⚠️ API Hit Successfully But Returned Error Response:");
        console.log("   Status Code:", error.response.status);
        console.log("   Status Text:", error.response.statusText);
        console.log(
          "   Response Data:",
          JSON.stringify(error.response.data, null, 2),
        );
        console.log(
          "   Response Headers:",
          JSON.stringify(error.response.headers, null, 2),
        );
        console.log(
          "   Request URL:",
          error.config?.url || error.request?.responseURL || apiUrl,
        );
        console.log("   Request Method:", error.config?.method || "GET");
        console.log(
          "   Request Headers:",
          JSON.stringify(error.config?.headers, null, 2),
        );
      } else if (error.request) {
        // Request was made but no response received
        console.log("❌ API Request Made But No Response Received:");
        console.log("   Error Type: Network Error / No Response");
        console.log("   Request URL:", apiUrl);
        console.log(
          "   Request Details:",
          JSON.stringify(error.request, null, 2),
        );
        console.log("   Error Message:", error.message);
      } else {
        // Request was not made (configuration error, etc.)
        console.log("❌ API Request Could Not Be Made:");
        console.log("   Error Type: Request Configuration Error");
        console.log("   Error Message:", error.message);
        console.log("   Error Stack:", error.stack);
      }

      console.log("   Full Error Object:", JSON.stringify(error, null, 2));
      console.log("🏪 ====================================================");

      return {
        success: false,
        error: "Failed to fetch stores. Please try again.",
        data: null as any,
      };
    }
  }

  // Get store details by store ID using the correct API endpoint
  async getStoreDetailsById(storeId: string): Promise<
    ApiResponse<{
      storeERPId: string;
      name: string;
      email: string;
      mobile: number;
      type: "pharma" | "grocery";
      isActive: boolean;
      status: string;
      storeId: string;
      createdAt: string;
      updatedAt: string;
      location: {
        type: string;
        coordinates: [number, number];
      };
      config: {
        deliveryMethods: {
          storePickup: boolean;
          homeDelivery: boolean;
        };
        paymentMethods: {
          online: boolean;
          offline: boolean;
        };
      };
      address: {
        address1: string;
        address2: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
      };
    }>
  > {
    try {
      console.log("🏪 Fetching store details for ID:", storeId);

      const response = await apiClient.get<{
        storeERPId: string;
        name: string;
        email: string;
        mobile: number;
        type: "pharma" | "grocery";
        isActive: boolean;
        status: string;
        storeId: string;
        createdAt: string;
        updatedAt: string;
        location: {
          type: string;
          coordinates: [number, number];
        };
        config: {
          deliveryMethods: {
            storePickup: boolean;
            homeDelivery: boolean;
          };
          paymentMethods: {
            online: boolean;
            offline: boolean;
          };
        };
        address: {
          address1: string;
          address2: string;
          city: string;
          state: string;
          pincode: string;
          country: string;
        };
      }>(`/v1/store/${storeId}/details`);

      console.log(
        "🏪 Store details API Response:",
        JSON.stringify(response, null, 2),
      );
      return response;
    } catch (error: any) {
      console.log(
        "❌ Store details API Error:",
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: "Failed to fetch store details. Please try again.",
        data: null as any,
      };
    }
  }
}

// Utility function to create a readable address from coordinates
export const createAddressFromCoordinates = (
  latitude: number,
  longitude: number,
): string => {
  console.log("🗺️ Creating address from coordinates:", { latitude, longitude });

  // For now, we'll create a more user-friendly location description
  // In a real app, you would use a proper geocoding service
  const lat = latitude.toFixed(6);
  const lng = longitude.toFixed(6);

  // You can customize this based on your needs
  return `Store Location (${lat}, ${lng})`;
};

// Utility function to format store address
export const formatStoreAddress = (
  address: {
    address1: string;
    address2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  },
  coordinates?: [number, number],
): string => {
  const addressParts = [];

  if (address.address1 && address.address1.trim()) {
    addressParts.push(address.address1.trim());
  }

  if (address.address2 && address.address2.trim()) {
    addressParts.push(address.address2.trim());
  }

  if (address.city && address.city.trim()) {
    addressParts.push(address.city.trim());
  }

  if (address.state && address.state.trim()) {
    addressParts.push(address.state.trim());
  }

  if (address.pincode && address.pincode.trim()) {
    addressParts.push(address.pincode.trim());
  }

  if (address.country && address.country.trim()) {
    addressParts.push(address.country.trim());
  }

  // If we have a complete address, return it
  if (addressParts.length > 0) {
    return addressParts.join(", ");
  }

  // If no address but we have coordinates, create a readable location
  if (coordinates && coordinates.length === 2) {
    const [latitude, longitude] = coordinates;
    console.log("🗺️ No address found, creating location from coordinates:", {
      latitude,
      longitude,
    });
    return createAddressFromCoordinates(latitude, longitude);
  }

  return "Store address not available";
};

// Create singleton instance
export const storeService = new StoreService();
export default storeService;
