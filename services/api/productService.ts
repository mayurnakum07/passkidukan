// services/api/productService.ts
import apiClient from './client';
import { 
  ApiResponse, 
  Product, 
  ExtendedProduct, 
  Category, 
  SubCategory,
  SearchParams,
  SearchResult,
  PaginatedResponse,
  PaginationParams,
  FilterOptions,
  AppliedFilters
} from './types';

export class ProductService {
  // GROCERY APIs
  async getGroceryCategories(storeId: string): Promise<ApiResponse<Category[]>> {
    console.log('🛒 Fetching grocery categories for store:', storeId);
    try {
      const response = await apiClient.get<Category[]>(`/v1/store/${storeId}/category/grocery`);
      console.log(' Grocery categories API response:', response);
      return response;
    } catch (error) {
      console.log('  Grocery categories API error:', error);
      throw error;
    }
  }

  async getGrocerySubcategories(storeId: string): Promise<ApiResponse<SubCategory[]>> {
    console.log('🛒 Fetching grocery subcategories for store:', storeId);
    try {
      const response = await apiClient.get<SubCategory[]>(`/v1/store/${storeId}/subcategory/grocery`);
      console.log(' Grocery subcategories API response:', response);
      return response;
    } catch (error) {
      console.log('  Grocery subcategories API error:', error);
      throw error;
    }
  }

  async getGroceryProducts(storeId: string): Promise<ApiResponse<Product[]>> {
    console.log('🛒 Fetching grocery products for store:', storeId);
    try {
      const response = await apiClient.get<Product[]>(`/v1/store/${storeId}/product/grocery`);
      console.log(' Grocery products API response:', response);
      return response;
    } catch (error) {
      console.log('  Grocery products API error:', error);
      throw error;
    }
  }

  async getGroceryProductDetails(storeId: string, productId: string): Promise<ApiResponse<ExtendedProduct>> {
    console.log('🛒 Fetching grocery product details:', { storeId, productId });
    try {
      const response = await apiClient.get<ExtendedProduct>(`/v1/store/${storeId}/product/grocery/${productId}`);
      console.log(' Grocery product details API response:', response);
      return response;
    } catch (error) {
      console.log('  Grocery product details API error:', error);
      throw error;
    }
  }

  // PHARMA APIs
  async getPharmaCategories(storeId: string): Promise<ApiResponse<Category[]>> {
    console.log('💊 Fetching pharma categories for store:', storeId);
    try {
      const response = await apiClient.get<Category[]>(`/v1/store/${storeId}/category/pharma`);
      console.log(' Pharma categories API response:', response);
      return response;
    } catch (error) {
      console.log('  Pharma categories API error:', error);
      throw error;
    }
  }

  async getPharmaSubcategories(storeId: string): Promise<ApiResponse<SubCategory[]>> {
    console.log('💊 Fetching pharma subcategories for store:', storeId);
    try {
      const response = await apiClient.get<SubCategory[]>(`/v1/store/${storeId}/subcategory/pharma`);
      console.log(' Pharma subcategories API response:', response);
      return response;
    } catch (error) {
      console.log('  Pharma subcategories API error:', error);
      throw error;
    }
  }

  async getPharmaProducts(storeId: string): Promise<ApiResponse<Product[]>> {
    console.log('💊 Fetching pharma products for store:', storeId);
    try {
      const response = await apiClient.get<Product[]>(`/v1/store/${storeId}/product/pharma`);
      console.log(' Pharma products API response:', response);
      return response;
    } catch (error) {
      console.log('  Pharma products API error:', error);
      throw error;
    }
  }

  async getPharmaProductDetails(storeId: string, productId: string): Promise<ApiResponse<ExtendedProduct>> {
    console.log('💊 Fetching pharma product details:', { storeId, productId });
    try {
      const response = await apiClient.get<ExtendedProduct>(`/v1/store/${storeId}/product/pharma/${productId}`);
      console.log(' Pharma product details API response:', response);
      return response;
    } catch (error) {
      console.log('  Pharma product details API error:', error);
      throw error;
    }
  }

  // Get products by store
  async getProductsByStore(
    storeId: string, 
    params?: PaginationParams & { 
      category?: string; 
      subCategory?: string;
      brand?: string;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: 'price' | 'name' | 'rating' | 'popularity';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const queryParams = { storeId, ...params };
    return apiClient.get<PaginatedResponse<Product>>('/products/by-store', queryParams);
  }

  // Get product details
  async getProductDetails(productId: string, storeId?: string): Promise<ApiResponse<ExtendedProduct>> {
    const params = storeId ? { storeId } : undefined;
    return apiClient.get<ExtendedProduct>(`/products/${productId}`, params);
  }

  // Get product variants
  async getProductVariants(productId: string): Promise<ApiResponse<ExtendedProduct['variants']>> {
    return apiClient.get<ExtendedProduct['variants']>(`/products/${productId}/variants`);
  }

  // Get product reviews
  async getProductReviews(
    productId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<ExtendedProduct['reviews'] extends (infer U)[] ? U : never>>> {
    return apiClient.get<PaginatedResponse<ExtendedProduct['reviews'] extends (infer U)[] ? U : never>>(
      `/products/${productId}/reviews`, 
      { page, limit }
    );
  }

  // Add product review
  async addProductReview(
    productId: string, 
    rating: number, 
    comment: string, 
    images?: string[]
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/products/${productId}/reviews`, {
      rating,
      comment,
      images,
    });
  }

  // Get categories
  async getCategories(storeId?: string): Promise<ApiResponse<Category[]>> {
    const params = storeId ? { storeId } : undefined;
    return apiClient.get<Category[]>('/categories', params);
  }

  // Get category details
  async getCategoryDetails(categoryId: string, storeId?: string): Promise<ApiResponse<Category>> {
    const params = storeId ? { storeId } : undefined;
    return apiClient.get<Category>(`/categories/${categoryId}`, params);
  }

  // Get subcategories
  async getSubcategories(categoryId: string, storeId?: string): Promise<ApiResponse<SubCategory[]>> {
    const params = storeId ? { storeId } : undefined;
    return apiClient.get<SubCategory[]>(`/categories/${categoryId}/subcategories`, params);
  }

  // Get products by category
  async getProductsByCategory(
    categoryId: string,
    storeId: string,
    params?: PaginationParams & {
      subCategory?: string;
      brand?: string;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: 'price' | 'name' | 'rating' | 'popularity';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const queryParams = { storeId, ...params };
    return apiClient.get<PaginatedResponse<Product>>(`/categories/${categoryId}/products`, queryParams);
  }

  // Search products
  async searchProducts(searchParams: SearchParams): Promise<ApiResponse<SearchResult>> {
    return apiClient.get<SearchResult>('/products/search', searchParams);
  }

  // Get search suggestions
  async getSearchSuggestions(query: string, storeId?: string): Promise<ApiResponse<{
    products: string[];
    categories: string[];
    brands: string[];
  }>> {
    const params = storeId ? { query, storeId } : { query };
    return apiClient.get<{
      products: string[];
      categories: string[];
      brands: string[];
    }>('/products/search-suggestions', params);
  }

  // Get filter options
  async getFilterOptions(
    storeId: string, 
    categoryId?: string
  ): Promise<ApiResponse<FilterOptions>> {
    const params = categoryId ? { storeId, categoryId } : { storeId };
    return apiClient.get<FilterOptions>('/products/filter-options', params);
  }

  // Get products with filters
  async getProductsWithFilters(
    storeId: string,
    filters: AppliedFilters,
    params?: PaginationParams & {
      sortBy?: 'price' | 'name' | 'rating' | 'popularity';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return apiClient.post<PaginatedResponse<Product>>('/products/filter', {
      storeId,
      filters,
      ...params,
    });
  }

  // Get featured products
  async getFeaturedProducts(storeId: string, limit: number = 10): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>('/products/featured', { storeId, limit });
  }

  // Get new arrivals
  async getNewArrivals(storeId: string, limit: number = 10): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>('/products/new-arrivals', { storeId, limit });
  }

  // Get trending products
  async getTrendingProducts(storeId: string, limit: number = 10): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>('/products/trending', { storeId, limit });
  }

  // Get products under price
  async getProductsUnderPrice(
    storeId: string, 
    maxPrice: number, 
    limit: number = 20
  ): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>('/products/under-price', { storeId, maxPrice, limit });
  }

  // Get products on sale
  async getProductsOnSale(storeId: string, limit: number = 20): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>('/products/on-sale', { storeId, limit });
  }

  // Get similar products
  async getSimilarProducts(
    productId: string, 
    storeId: string, 
    limit: number = 10
  ): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>(`/products/${productId}/similar`, { storeId, limit });
  }

  // Get frequently bought together
  async getFrequentlyBoughtTogether(
    productId: string, 
    storeId: string, 
    limit: number = 5
  ): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>(`/products/${productId}/frequently-bought`, { storeId, limit });
  }

  // Get product recommendations
  async getProductRecommendations(
    userId: string, 
    storeId: string, 
    limit: number = 10
  ): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>('/products/recommendations', { userId, storeId, limit });
  }

  // Get recently viewed products
  async getRecentlyViewedProducts(limit: number = 10): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>('/products/recently-viewed', { limit });
  }

  // Add to recently viewed
  async addToRecentlyViewed(productId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/products/recently-viewed', { productId });
  }

  // Get product availability
  async getProductAvailability(
    productId: string, 
    storeId: string
  ): Promise<ApiResponse<{
    isAvailable: boolean;
    availableQty: number;
    estimatedRestock?: string;
  }>> {
    return apiClient.get<{
      isAvailable: boolean;
      availableQty: number;
      estimatedRestock?: string;
    }>(`/products/${productId}/availability`, { storeId });
  }

  // Get product nutritional info
  async getProductNutritionalInfo(productId: string): Promise<ApiResponse<Product['nutritionalInfo']>> {
    return apiClient.get<Product['nutritionalInfo']>(`/products/${productId}/nutritional-info`);
  }

  // Get product specifications
  async getProductSpecifications(productId: string): Promise<ApiResponse<ExtendedProduct['specifications']>> {
    return apiClient.get<ExtendedProduct['specifications']>(`/products/${productId}/specifications`);
  }

  // Get brands
  async getBrands(storeId?: string, categoryId?: string): Promise<ApiResponse<string[]>> {
    const params: Record<string, any> = {};
    if (storeId) params.storeId = storeId;
    if (categoryId) params.categoryId = categoryId;
    return apiClient.get<string[]>('/products/brands', params);
  }

  // Get products by brand
  async getProductsByBrand(
    brand: string,
    storeId: string,
    params?: PaginationParams & {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: 'price' | 'name' | 'rating' | 'popularity';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const queryParams = { brand, storeId, ...params };
    return apiClient.get<PaginatedResponse<Product>>('/products/by-brand', queryParams);
  }

  // Compare products
  async compareProducts(productIds: string[]): Promise<ApiResponse<{
    products: Product[];
    comparison: Record<string, any>;
  }>> {
    return apiClient.post<{
      products: Product[];
      comparison: Record<string, any>;
    }>('/products/compare', { productIds });
  }

  // Get product images
  async getProductImages(productId: string): Promise<ApiResponse<{ images: string[] }>> {
    return apiClient.get<{ images: string[] }>(`/products/${productId}/images`);
  }

  // Report product issue
  async reportProductIssue(
    productId: string, 
    issue: string, 
    description?: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/products/${productId}/report`, {
      issue,
      description,
    });
  }
}

// Create singleton instance
export const productService = new ProductService();
export default productService; 