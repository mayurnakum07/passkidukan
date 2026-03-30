// services/api/storeProductService.ts
import apiClient from "./client";
import {
  ApiResponse,
  Product,
  ExtendedProduct,
  Category,
  SubCategory,
} from "./types";
import { API_CONFIG, buildApiUrl, isApiEnabled } from "./config";

// Helpers to normalize backend shapes to UI-friendly shapes
// Removed placeholder image - use empty string or null instead
const PLACEHOLDER_IMAGE = "";

// Default page size for paginated product lists
const DEFAULT_PRODUCTS_PAGE_SIZE = 10;

// Helper function to build full image URL from relative path
const buildImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath) return PLACEHOLDER_IMAGE;

  // If already a full URL (starts with http:// or https://), return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // If it's a relative path (starts with /), prepend base URL
  if (imagePath.startsWith("/")) {
    const fullUrl = `${API_CONFIG.BASE_URL}${imagePath}`;
    console.log("🖼️ Building image URL:", {
      original: imagePath,
      full: fullUrl,
    });
    return fullUrl;
  }

  // Otherwise, assume it's already a full URL or return placeholder
  return imagePath || PLACEHOLDER_IMAGE;
};

const mapCategory = (raw: any): Category => {
  return {
    id:
      raw.categoryId ||
      raw.id ||
      String(raw.categoryERPId || raw.subcategoryERPId || Math.random()),
    name: raw.name || raw.title || "Category",
    image: buildImageUrl(raw.signedImage || raw.image),
    description: raw.description || undefined,
    isActive: raw.status ? String(raw.status).toLowerCase() === "active" : true,
    subCategories: [],
  } as Category;
};

const mapSubCategory = (raw: any): SubCategory => {
  return {
    id:
      raw.subcategoryId ||
      raw.id ||
      String(raw.subcategoryERPId || Math.random()),
    name: raw.name || "Subcategory",
    image: buildImageUrl(raw.signedImage || raw.image),
    description: raw.description || undefined,
    parentCategoryId: raw.categoryId || raw.category?.categoryId,
    products: [],
  } as SubCategory;
};

const toNumber = (val: any): number => {
  if (typeof val === "number") return val;
  if (val === null || val === undefined || val === "") return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

// Helper to parse quantity - handles string numbers like "150"
const parseQuantity = (val: any): number => {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") {
    return Number.isInteger(val) && val > 0 ? val : 0;
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    const num = parseInt(trimmed, 10);
    return !isNaN(num) && num > 0 ? num : 0;
  }
  return 0;
};

const pickPrice = (raw: any): number => {
  // Prefer selling price fields; backend may send strings like 'sp' and 'mrp'
  const candidates = [
    raw.sp,
    raw.price,
    raw.sellingPrice,
    raw.salePrice,
    raw.mrp,
    raw.maxRetailPrice,
  ];
  for (const c of candidates) {
    const n = toNumber(c);
    if (n > 0) return n;
  }
  return 0;
};

const pickImage = (raw: any): string => {
  // Priority: signedImage > signedImages[0] > image > images[0] > placeholder
  // Check signedImage only if it's a valid non-empty string
  if (
    raw.signedImage &&
    typeof raw.signedImage === "string" &&
    raw.signedImage.trim().length > 0
  ) {
    return buildImageUrl(raw.signedImage);
  }
  // Check signedImages array first (preferred)
  if (Array.isArray(raw.signedImages) && raw.signedImages.length > 0) {
    return buildImageUrl(raw.signedImages[0]);
  }
  // Check image only if it's a valid non-empty string
  if (
    raw.image &&
    typeof raw.image === "string" &&
    raw.image.trim().length > 0
  ) {
    return buildImageUrl(raw.image);
  }
  // Check images array
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    return buildImageUrl(raw.images[0]);
  }
  return PLACEHOLDER_IMAGE;
};

const mapProduct = (raw: any, category: "grocery" | "pharma"): Product => {
  // Handle images array: prefer signedImages, fallback to images
  // Build full URLs for all images in the array
  const rawImagesArray = raw.signedImages || raw.images || undefined;
  const imagesArray = Array.isArray(rawImagesArray)
    ? rawImagesArray.map((img: string) => buildImageUrl(img))
    : undefined;

  // Ensure primary image is set - prioritize first image from array if available
  let primaryImage = pickImage(raw);

  // If primaryImage is placeholder or invalid, use first image from array
  if (
    (primaryImage === PLACEHOLDER_IMAGE ||
      !primaryImage ||
      (typeof primaryImage === "string" && primaryImage.trim().length === 0)) &&
    imagesArray &&
    imagesArray.length > 0
  ) {
    primaryImage = imagesArray[0];
  }

  const finalImage = primaryImage;

  return {
    id: raw.productId || raw.id || String(Math.random()),
    // Prefer fullName (used by backend), then name/productName
    name: raw.fullName || raw.name || raw.productName || "Product",
    price: pickPrice(raw),
    originalPrice: (() => {
      const n = toNumber(raw.mrp);
      return n > 0 ? n : undefined;
    })(),
    image: finalImage,
    images: imagesArray,
    description: raw.description || undefined,
    brand: raw.brand || raw.brandName || undefined,
    category,
    subCategory: raw.subcategoryId || raw.subCategoryId || undefined,
    // Prefer availableQty when backend sends it (including 0) so list and detail stay in sync
    availableQty:
      raw.availableQty !== undefined && raw.availableQty !== null
        ? parseQuantity(raw.availableQty)
        : parseQuantity(raw.stock ?? raw.quantity),
    unit: raw.unit || raw.unitOfMeasure || "unit",
    weight: raw.weight || undefined,
    expiryDate: raw.expiryDate || undefined,
    isAvailable: raw.isAvailable ?? true,
    isOnSale: raw.isOnSale ?? false,
    discountPercentage: raw.discountPercentage || undefined,
    rating: raw.rating || undefined,
    reviewCount: raw.reviewCount || undefined,
    variants: raw.variants || undefined,
    tags: raw.tags || undefined,
    // Only meaningful for pharma products; ensure boolean
    prescriptionRequired:
      category === "pharma" ? raw.prescriptionRequired === true : false,
  } as Product;
};

const mapExtendedProduct = (
  raw: any,
  category: "grocery" | "pharma",
): ExtendedProduct => {
  const base = mapProduct(raw, category);
  return {
    ...base,
    similarProducts: Array.isArray(raw.similarProducts)
      ? raw.similarProducts.map((p: any) => mapProduct(p, category))
      : undefined,
    reviews: raw.reviews || undefined,
    specifications: raw.specifications || undefined,
    // Pass through long form description fields so screens can render them
    productDescription: raw.productDescription || raw.description || undefined,
    servingSize:
      raw.servingSize || raw.howToUse || raw.servingsPerPack || undefined,
    prescriptionRequired: raw.prescriptionRequired,
  } as ExtendedProduct;
};

export class StoreProductService {
  // GROCERY APIs
  async getGroceryCategories(
    storeId: string,
  ): Promise<ApiResponse<Category[]>> {
    console.log("🛒 Fetching grocery categories for store:", storeId);

    if (!isApiEnabled("USE_REAL_CATEGORIES")) {
      console.log("   API disabled for grocery categories");
      throw new Error("API_DISABLED");
    }

    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.GROCERY_CATEGORIES, {
        storeId,
      });
      // Fetch all categories by passing a high limit parameter
      const response = await apiClient.get<any>(url, { limit: 100, page: 1 });
      const raw = response.data;

      // Check if pagination is needed
      const totalCount = raw?.count || 0;
      const currentData = Array.isArray(raw?.data) ? raw.data : [];
      let allCategories = [...currentData];

      // If there are more categories, fetch remaining pages
      if (totalCount > currentData.length) {
        const itemsPerPage = currentData.length || 10;
        const totalPages = Math.ceil(totalCount / itemsPerPage);

        console.log(
          `🛒 Fetching ${totalPages} pages of grocery categories (total: ${totalCount})`,
        );

        // Fetch remaining pages
        for (let page = 2; page <= totalPages; page++) {
          try {
            const pageResponse = await apiClient.get<any>(url, {
              limit: itemsPerPage,
              page,
            });
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

      const mapped = allCategories.map(mapCategory);
      console.log(
        `🛒 Grocery categories API mapped: ${mapped.length} out of ${totalCount} total`,
      );
      return { success: true, data: mapped } as ApiResponse<Category[]>;
    } catch (error) {
      console.log("  Grocery categories API error:", error);
      console.log("   Error fetching grocery categories");
      throw error;
    }
  }

  async getGrocerySubcategories(
    storeId: string,
  ): Promise<ApiResponse<SubCategory[]>> {
    console.log("🛒 Fetching grocery subcategories for store:", storeId);

    if (!isApiEnabled("USE_REAL_CATEGORIES")) {
      console.log("   API disabled for grocery subcategories");
      throw new Error("API_DISABLED");
    }

    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.GROCERY_SUBCATEGORIES, {
        storeId,
      });
      const response = await apiClient.get<any>(url);
      const raw = response.data;
      const mapped = Array.isArray(raw?.data)
        ? raw.data.map(mapSubCategory)
        : [];
      console.log(" Grocery subcategories API mapped:", mapped.length);
      return { success: true, data: mapped } as ApiResponse<SubCategory[]>;
    } catch (error) {
      console.log("  Grocery subcategories API error:", error);
      console.log("   Error fetching grocery subcategories");
      throw error;
    }
  }

  async getGroceryProducts(storeId: string): Promise<ApiResponse<Product[]>> {
    console.log("🛒 Fetching grocery products for store:", storeId);

    if (!isApiEnabled("USE_REAL_PRODUCTS")) {
      console.log("   API disabled for grocery products");
      throw new Error("API_DISABLED");
    }

    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.GROCERY_PRODUCTS, {
        storeId,
      });
      const response = await apiClient.get<any>(url);
      const raw = response.data;
      const mapped = Array.isArray(raw?.data)
        ? raw.data.map((p: any) => mapProduct(p, "grocery"))
        : [];
      console.log(" Grocery products API mapped:", mapped.length);
      return { success: true, data: mapped } as ApiResponse<Product[]>;
    } catch (error) {
      console.log("  Grocery products API error:", error);
      console.log("   Error fetching grocery products");
      throw error;
    }
  }

  async getGroceryProductsBySubcategory(
    storeId: string,
    subcategoryId: string,
  ): Promise<ApiResponse<Product[]>> {
    console.log("🛒 Fetching grocery products for subcategory:", {
      storeId,
      subcategoryId,
    });

    if (!isApiEnabled("USE_REAL_PRODUCTS")) {
      console.log("   API disabled for grocery products");
      throw new Error("API_DISABLED");
    }

    // Keep this method for backward-compat callers; it now fetches the first page
    return this.getGroceryProductsBySubcategoryPaged(
      storeId,
      subcategoryId,
      1,
      DEFAULT_PRODUCTS_PAGE_SIZE,
    );
  }

  // Paginated grocery products by subcategory – preferred for lists
  async getGroceryProductsBySubcategoryPaged(
    storeId: string,
    subcategoryId: string,
    page: number = 1,
    limit: number = DEFAULT_PRODUCTS_PAGE_SIZE,
  ): Promise<ApiResponse<Product[]>> {
    if (!isApiEnabled("USE_REAL_PRODUCTS")) {
      console.log("   API disabled for grocery products");
      throw new Error("API_DISABLED");
    }

    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.GROCERY_PRODUCTS, {
        storeId,
      });
      // Backend supports subcategory filtering via query param array.
      // Old logic example:
      // filters[subcategories][0]=<subcategoryId>&page=<page>
      const response = await apiClient.get<any>(url, {
        limit,
        page,
        "filters[subcategories][0]": subcategoryId,
      });

      const raw = response.data;
      const rawProducts = Array.isArray(raw?.data) ? raw.data : [];
      const mapped = rawProducts.map((p: any) => mapProduct(p, "grocery"));
      return { success: true, data: mapped } as ApiResponse<Product[]>;
    } catch (error) {
      console.log(
        "  Grocery products by subcategory (paged) API error:",
        error,
      );
      console.log("   Error fetching grocery products for subcategory");
      throw error;
    }
  }

  async getGroceryProductDetails(
    storeId: string,
    productId: string,
  ): Promise<ApiResponse<ExtendedProduct>> {
    console.log("🛒 Fetching grocery product details:", { storeId, productId });

    if (!isApiEnabled("USE_REAL_PRODUCTS")) {
      console.log("   API disabled for grocery product details");
      throw new Error("API_DISABLED");
    }

    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.GROCERY_PRODUCT_DETAILS, {
        storeId,
        productId,
      });
      const response = await apiClient.get<any>(url);
      const raw = response.data?.data || response.data;
      const mapped = mapExtendedProduct(raw, "grocery");
      console.log(" Grocery product details API mapped");
      return { success: true, data: mapped } as ApiResponse<ExtendedProduct>;
    } catch (error) {
      console.log("  Grocery product details API error:", error);
      console.log("   Error fetching grocery product details");
      throw error;
    }
  }

  // PHARMA APIs
  async getPharmaCategories(storeId: string): Promise<ApiResponse<Category[]>> {
    console.log("💊 Fetching pharma categories for store:", storeId);

    if (!isApiEnabled("USE_REAL_CATEGORIES")) {
      console.log("   API disabled for pharma categories");
      throw new Error("API_DISABLED");
    }

    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.PHARMA_CATEGORIES, {
        storeId,
      });
      // Fetch all categories by passing a high limit parameter
      const response = await apiClient.get<any>(url, { limit: 100, page: 1 });
      const raw = response.data;

      // Check if pagination is needed
      const totalCount = raw?.count || 0;
      const currentData = Array.isArray(raw?.data) ? raw.data : [];
      let allCategories = [...currentData];

      // If there are more categories, fetch remaining pages
      if (totalCount > currentData.length) {
        const itemsPerPage = currentData.length || 10;
        const totalPages = Math.ceil(totalCount / itemsPerPage);

        console.log(
          `💊 Fetching ${totalPages} pages of pharma categories (total: ${totalCount})`,
        );

        // Fetch remaining pages
        for (let page = 2; page <= totalPages; page++) {
          try {
            const pageResponse = await apiClient.get<any>(url, {
              limit: itemsPerPage,
              page,
            });
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

      const mapped = allCategories.map(mapCategory);
      console.log(
        `💊 Pharma categories API mapped: ${mapped.length} out of ${totalCount} total`,
      );
      return { success: true, data: mapped } as ApiResponse<Category[]>;
    } catch (error) {
      console.log("  Pharma categories API error:", error);
      console.log("   Error fetching pharma categories");
      throw error;
    }
  }

  async getPharmaSubcategories(
    storeId: string,
  ): Promise<ApiResponse<SubCategory[]>> {
    console.log("💊 Fetching pharma subcategories for store:", storeId);

    if (!isApiEnabled("USE_REAL_CATEGORIES")) {
      console.log("   API disabled for pharma subcategories");
      throw new Error("API_DISABLED");
    }

    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.PHARMA_SUBCATEGORIES, {
        storeId,
      });
      const response = await apiClient.get<any>(url);
      const raw = response.data;
      const mapped = Array.isArray(raw?.data)
        ? raw.data.map(mapSubCategory)
        : [];
      console.log(" Pharma subcategories API mapped:", mapped.length);
      return { success: true, data: mapped } as ApiResponse<SubCategory[]>;
    } catch (error) {
      console.log("  Pharma subcategories API error:", error);
      console.log("   Error fetching pharma subcategories");
      throw error;
    }
  }

  async getPharmaProducts(storeId: string): Promise<ApiResponse<Product[]>> {
    console.log("💊 Fetching pharma products for store:", storeId);

    if (!isApiEnabled("USE_REAL_PRODUCTS")) {
      console.log("   API disabled for pharma products");
      throw new Error("API_DISABLED");
    }

    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.PHARMA_PRODUCTS, {
        storeId,
      });
      const response = await apiClient.get<any>(url);
      const raw = response.data;
      const mapped = Array.isArray(raw?.data)
        ? raw.data.map((p: any) => mapProduct(p, "pharma"))
        : [];
      console.log(" Pharma products API mapped:", mapped.length);
      return { success: true, data: mapped } as ApiResponse<Product[]>;
    } catch (error) {
      console.log("  Pharma products API error:", error);
      console.log("   Error fetching pharma products");
      throw error;
    }
  }

  async getPharmaProductDetails(
    storeId: string,
    productId: string,
  ): Promise<ApiResponse<ExtendedProduct>> {
    console.log("💊 Fetching pharma product details:", { storeId, productId });

    if (!isApiEnabled("USE_REAL_PRODUCTS")) {
      console.log("   API disabled for pharma product details");
      throw new Error("API_DISABLED");
    }

    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.PHARMA_PRODUCT_DETAILS, {
        storeId,
        productId,
      });
      const response = await apiClient.get<any>(url);
      const raw = response.data?.data || response.data;
      const mapped = mapExtendedProduct(raw, "pharma");
      console.log(" Pharma product details API mapped");
      return { success: true, data: mapped } as ApiResponse<ExtendedProduct>;
    } catch (error) {
      console.log("  Pharma product details API error:", error);
      console.log("   Error fetching pharma product details");
      throw error;
    }
  }

  async getPharmaProductsBySubcategory(
    storeId: string,
    subcategoryId: string,
  ): Promise<ApiResponse<Product[]>> {
    return this.getPharmaProductsBySubcategoryPaged(
      storeId,
      subcategoryId,
      1,
      DEFAULT_PRODUCTS_PAGE_SIZE,
    );
  }

  // Paginated pharma products by subcategory – used by category and search flows
  async getPharmaProductsBySubcategoryPaged(
    storeId: string,
    subcategoryId: string,
    page: number = 1,
    limit: number = DEFAULT_PRODUCTS_PAGE_SIZE,
  ): Promise<ApiResponse<Product[]>> {
    if (!isApiEnabled("USE_REAL_PRODUCTS")) {
      throw new Error("API_DISABLED");
    }

    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.PHARMA_PRODUCTS, {
        storeId,
      });
      // Backend supports subcategory filtering via query param array.
      const response = await apiClient.get<any>(url, {
        limit,
        page,
        "filters[subcategories][0]": subcategoryId,
      });

      const raw = response.data;
      const rawProducts = Array.isArray(raw?.data) ? raw.data : [];
      const mapped = rawProducts.map((p: any) => mapProduct(p, "pharma"));

      return { success: true, data: mapped } as ApiResponse<Product[]>;
    } catch (error) {
      throw error;
    }
  }

  async getFilteredPharmaProducts(
    storeId: string,
    filters: { brand?: string },
  ): Promise<ApiResponse<Product[]>> {
    console.log("💊 Fetching filtered pharma products:", { storeId, filters });

    if (!isApiEnabled("USE_REAL_PRODUCTS")) {
      console.log("   API disabled for filtered pharma products");
      throw new Error("API_DISABLED");
    }

    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.PHARMA_PRODUCTS, {
        storeId,
      });
      const response = await apiClient.post<any>(url, { filters });
      const raw = response.data;
      const mapped = Array.isArray(raw?.data)
        ? raw.data.map((p: any) => mapProduct(p, "pharma"))
        : [];
      console.log(" Filtered pharma products API mapped:", mapped.length);
      return { success: true, data: mapped } as ApiResponse<Product[]>;
    } catch (error) {
      console.log("  Filtered pharma products API error:", error);
      console.log("   Error fetching filtered pharma products");
      throw error;
    }
  }

  async getFilteredGroceryProducts(
    storeId: string,
    filters: { brand?: string },
  ): Promise<ApiResponse<Product[]>> {
    console.log("🛒 Fetching filtered grocery products:", { storeId, filters });

    if (!isApiEnabled("USE_REAL_PRODUCTS")) {
      console.log("   API disabled for filtered grocery products");
      throw new Error("API_DISABLED");
    }

    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.GROCERY_PRODUCTS, {
        storeId,
      });
      const response = await apiClient.post<any>(url, { filters });
      const raw = response.data;
      const mapped = Array.isArray(raw?.data)
        ? raw.data.map((p: any) => mapProduct(p, "grocery"))
        : [];
      console.log(" Filtered grocery products API mapped:", mapped.length);
      return { success: true, data: mapped } as ApiResponse<Product[]>;
    } catch (error) {
      console.log("  Filtered grocery products API error:", error);
      console.log("   Error fetching filtered grocery products");
      throw error;
    }
  }
}

export const storeProductService = new StoreProductService();
