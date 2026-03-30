import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Divider } from "native-base";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAppContext } from "../../contexts/AppContext";
import { useCart } from "../../contexts/CartContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { RootStackParamList } from "../../navigation/types";
import { storeProductService } from "../../services/api/storeProductService";
import { storeService } from "../../services/api/storeService";

const { width, height } = Dimensions.get("window");
const LEFT_COLUMN_WIDTH = 96;
// Single source of truth for how many products we load per page
const PRODUCTS_PAGE_SIZE = 10;

// Types

type CategoryDetailRouteProp = RouteProp<RootStackParamList, "CategoryDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  description?: string;
  brand?: string;
  variants?: { id: string; name: string; price: number; stock: number }[];
  availableQty?: number;
  prescriptionRequired?: boolean;
}

interface SubCategory {
  id: string;
  name: string;
  products: Product[];
  brands?: string[];
}

interface Category {
  id: string;
  name: string;
  image: string;
  subCategories: SubCategory[];
}

// Dummy data removed

const priceOptions = [
  { key: "below_50", label: "Below ₹50", min: 0, max: 50 },
  { key: "50_100", label: "₹50 - ₹100", min: 50, max: 100 },
  { key: "100_200", label: "₹100 - ₹200", min: 100, max: 200 },
  { key: "above_200", label: "Above ₹200", min: 200, max: Infinity },
];

const packSizeOptions = [
  { key: "small", label: "Small Pack" },
  { key: "medium", label: "Medium Pack" },
  { key: "large", label: "Large Pack" },
];

const discountOptions = [
  { key: "10", label: "10% or more", min: 10 },
  { key: "20", label: "20% or more", min: 20 },
  { key: "30", label: "30% or more", min: 30 },
  { key: "50", label: "50% or more", min: 50 },
];

const CategoryDetailScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, "CategoryDetail">>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, section } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    addToGroceryCart,
    addToPharmacyCart,
    removeFromCart,
    updateQuantity,
    groceryItems,
    pharmacyItems,
  } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const {
    selectedStore,
    lastVisitedStore,
    lastVisitedGroceryStore,
    lastVisitedPharmacyStore,
  } = useAppContext();
  const { category } = route.params;

  // Determine if this is pharma or grocery based on current section
  const isPharma = section === "pharma";

  // Get the effective store to use (selectedStore or fallback to last visited stores)
  const effectiveStore =
    selectedStore ||
    lastVisitedStore ||
    lastVisitedGroceryStore ||
    lastVisitedPharmacyStore;

  // State for API data
  const [apiSubCategories, setApiSubCategories] = useState<any[]>([]);
  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const subCategories = apiSubCategories;

  // Prevent out-of-order async responses from overwriting state.
  const productsFetchSeqRef = useRef(0);
  const productsListRef = useRef<FlatList<Product> | null>(null);

  // Pagination state for products within a subcategory
  const [productsPage, setProductsPage] = useState(1);
  const [hasMoreProductsPage, setHasMoreProductsPage] = useState(false);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);

  // Use pre-selected subcategory if provided, otherwise set from API when loaded
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    string | undefined
  >(category.selectedSubcategoryId);
  const [sortBy, setSortBy] = useState<
    "relevance" | "price_low_high" | "price_high_low" | "a_z" | "z_a"
  >("relevance");

  // Filter states
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedPackSizes, setSelectedPackSizes] = useState<string[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<{
    [productId: string]:
      | { id: string; name: string; price: number; stock: number }
      | undefined;
  }>({});

  // Fetch subcategories when component mounts
  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!effectiveStore?.id || !category.id) return;

      setLoading(true);
      try {
        console.log(
          "🔍 CategoryDetailScreen: Fetching subcategories for category:",
          category.id,
          "section:",
          section,
        );

        // Fetch subcategories for this specific category only - use current section (pharma or grocery)
        // NOTE: Backend expects categoryId in filters[categoryId] query param; pass storeId as well.
        const subcategoriesResponse =
          await storeService.getCategorySubcategories(
            category.id,
            section as "pharma" | "grocery",
            effectiveStore.id,
          );

        if (subcategoriesResponse.success && subcategoriesResponse.data) {
          const payload: any = subcategoriesResponse.data;
          const subcategoriesData: any[] = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
          // Filter subcategories to only include those belonging to this specific category
          const filteredSubcategories = Array.isArray(subcategoriesData)
            ? subcategoriesData
                .filter((sc: any) => sc.categoryId === category.id) // Only include subcategories for this category
                .map((sc: any) => ({
                  id: sc.subcategoryId,
                  name: sc.name,
                  image: sc.signedImage || sc.image || undefined,
                  products: [], // Will be fetched separately for each subcategory
                  brands: [],
                }))
            : [];

          setApiSubCategories(filteredSubcategories);
          if (
            !category.selectedSubcategoryId &&
            !selectedSubCategoryId &&
            filteredSubcategories.length > 0
          ) {
            setSelectedSubCategoryId(filteredSubcategories[0].id);
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [effectiveStore?.id, category.id, section]);

  // Fetch products for the selected subcategory and apply brand filters
  useEffect(() => {
    let cancelled = false;
    let seq = 0;

    const fetchSubcategoryProducts = async () => {
      if (!effectiveStore?.id || !selectedSubCategoryId) return;

      // Each time we start a fetch, bump the token.
      // Only the latest token is allowed to update React state.
      seq = ++productsFetchSeqRef.current;
      setLoading(true);
      setProductsPage(1);
      setHasMoreProductsPage(false);
      try {
        // Use section from ThemeContext to determine pharma or grocery (more reliable than category.type)
        // Fallback to category.type or name check if section is not available
        const isPharmaCategory =
          isPharma ||
          category.type === "pharma" ||
          category.name?.toLowerCase().includes("medicine") ||
          category.name?.toLowerCase().includes("pharma");

        let response;
        if (selectedBrands.length > 0) {
          // Apply brand filter using the new API (no pagination yet)
          const filters = { brand: selectedBrands[0] }; // Use first selected brand
          if (isPharmaCategory) {
            response = await storeProductService.getFilteredPharmaProducts(
              effectiveStore.id,
              filters,
            );
          } else {
            response = await storeProductService.getFilteredGroceryProducts(
              effectiveStore.id,
              filters,
            );
          }

          if (response.success && response.data) {
            if (!cancelled && seq === productsFetchSeqRef.current) {
              setApiProducts(response.data);
              setHasMoreProductsPage(false);
              setProductsPage(1);
            }
          } else {
            if (!cancelled && seq === productsFetchSeqRef.current) {
              setApiProducts([]);
              setHasMoreProductsPage(false);
              setProductsPage(1);
            }
          }
        } else {
          // Fetch first page of products for subcategory
          if (isPharmaCategory) {
            response =
              await storeProductService.getPharmaProductsBySubcategoryPaged(
                effectiveStore.id,
                selectedSubCategoryId,
                1,
                PRODUCTS_PAGE_SIZE,
              );
          } else {
            response =
              await storeProductService.getGroceryProductsBySubcategoryPaged(
                effectiveStore.id,
                selectedSubCategoryId,
                1,
                PRODUCTS_PAGE_SIZE,
              );
          }

          if (response.success && response.data) {
            const initialProducts = response.data;
            if (!cancelled && seq === productsFetchSeqRef.current) {
              setApiProducts(initialProducts);
              // If the backend returns fewer than the requested page size,
              // we assume it's the last page.
              const hasMore = initialProducts.length === PRODUCTS_PAGE_SIZE;
              setHasMoreProductsPage(hasMore);
              setProductsPage(hasMore ? 2 : 1);
            }
          } else {
            if (!cancelled && seq === productsFetchSeqRef.current) {
              setApiProducts([]);
              setHasMoreProductsPage(false);
              setProductsPage(1);
            }
          }
        }
      } catch (error) {
        console.error(
          "🔍 CategoryDetailScreen: Error fetching products:",
          error,
        );
        if (!cancelled && seq === productsFetchSeqRef.current) {
          setApiProducts([]);
        }
      } finally {
        if (!cancelled && seq === productsFetchSeqRef.current) {
          setLoading(false);
        }
      }
    };

    fetchSubcategoryProducts();

    return () => {
      cancelled = true;
    };
  }, [
    effectiveStore?.id,
    selectedSubCategoryId,
    selectedBrands,
    isPharma,
    section,
    category.type,
    category.name,
  ]);

  // Reset scroll position when subcategory changes
  useEffect(() => {
    productsListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [selectedSubCategoryId]);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  // 1. Add state for selected filter tab and search
  const [selectedFilterTab, setSelectedFilterTab] = useState("Brand");
  const [brandSearch, setBrandSearch] = useState("");
  const filterTabs = [
    { key: "Brand", label: "Brand" },
    // { key: 'Type', label: 'Type' },
    // { key: 'Quantity', label: 'Quantity' },
    // { key: 'DietPref', label: 'Diet Prefe..' },
  ];

  // Get cart quantity for a product
  const getCartQuantity = (productId: string): number => {
    const cartItems = isPharma ? pharmacyItems : groceryItems;
    const existing = cartItems.find((item) => item.id === productId);
    return existing?.quantity || 0;
  };

  // Use only API products
  let products: Product[] = apiProducts;
  console.log("products", products);
  if (sortBy === "price_low_high") {
    products = [...products].sort(
      (a: Product, b: Product) => a.price - b.price,
    );
  } else if (sortBy === "price_high_low") {
    products = [...products].sort(
      (a: Product, b: Product) => b.price - a.price,
    );
  } else if (sortBy === "a_z") {
    products = [...products].sort((a: Product, b: Product) =>
      a.name.localeCompare(b.name),
    );
  } else if (sortBy === "z_a") {
    products = [...products].sort((a: Product, b: Product) =>
      b.name.localeCompare(a.name),
    );
  }
  if (selectedBrands.length > 0) {
    products = products.filter(
      (p: Product) => p.brand && selectedBrands.includes(p.brand),
    );
  }
  if (selectedPrice) {
    const priceObj = priceOptions.find((opt) => opt.key === selectedPrice);
    if (priceObj) {
      products = products.filter(
        (p: Product) => p.price >= priceObj.min && p.price < priceObj.max,
      );
    }
  }
  if (selectedPackSizes.length > 0) {
    // For demo, filter by product name containing pack size label (mock logic)
    products = products.filter((p: Product) =>
      selectedPackSizes.some((size) => p.name.toLowerCase().includes(size)),
    );
  }
  if (selectedDiscount) {
    const discountObj = discountOptions.find(
      (opt) => opt.key === selectedDiscount,
    );
    if (discountObj) {
      // For demo, assume all products have 20% discount (mock logic)
      products = products.filter(() => 20 >= discountObj.min);
    }
  }

  // Collect all brands from products in the selected subcategory
  const allBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    if (Array.isArray(subCategories)) {
      subCategories.forEach((sc: SubCategory) => {
        if (sc.products && Array.isArray(sc.products)) {
          sc.products.forEach(
            (p: Product) => p.brand && brandsSet.add(p.brand),
          );
        }
      });
    }
    return Array.from(brandsSet);
  }, [subCategories]);

  // Sort options
  const sortOptions = [
    { key: "relevance", label: "Relevance" },
    { key: "price_low_high", label: "Price: Low to High" },
    { key: "price_high_low", label: "Price: High to Low" },
    { key: "a_z", label: "A-Z" },
    { key: "z_a", label: "Z-A" },
  ];

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedPrice(null);
    setSelectedPackSizes([]);
    setSelectedDiscount(null);
  };

  // Helper function to validate quantity (similar to ProductCard)
  const isValidQuantity = (value: any): boolean => {
    if (value === null || value === undefined || value === "") return false;
    if (typeof value === "number") {
      return Number.isInteger(value) && value > 0 && isFinite(value);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      const num = parseInt(trimmed, 10);
      return !isNaN(num) && num > 0 && String(num) === trimmed;
    }
    return false;
  };

  // Get valid quantity for a product
  const getValidQuantity = (product: Product): number => {
    const qty =
      product.availableQty ||
      (product as any).quantity ||
      (product as any).stock ||
      0;
    if (isValidQuantity(qty)) {
      if (typeof qty === "number") {
        return qty;
      }
      if (typeof qty === "string") {
        return parseInt(qty.trim(), 10);
      }
    }
    return 0;
  };

  // Check if product can be added to cart
  const canAddToCart = (product: Product): boolean => {
    const price = product.price || 0;
    // const qty = getValidQuantity(product);
    return price > 0; // && qty > 0;
  };

  const handleAddToCart = (
    product: Product,
    variant?: { id: string; name: string; price: number; stock: number },
  ) => {
    addToGroceryCart({
      id: variant ? `${product.id}-${variant.id}` : product.id,
      name: product.name,
      price: variant ? variant.price : product.price,
      image: product.image,
      variant: variant ? { name: variant.name, unit: "unit" } : undefined,
      prescriptionRequired: product.prescriptionRequired || false,
    });
  };

  const handleFavToggle = (product: Product) => (e: any) => {
    e?.stopPropagation?.();
    if (isInWishlist(product.id)) removeFromWishlist(product.id);
    else
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        brand: product.brand,
      });
  };

  // No placeholder image - use empty string if image not present
  const SUBCATEGORY_PLACEHOLDER_IMAGE =
    "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg";

  // --- UI ---
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top"]}
    >
      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: theme.colors.white,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={32}
            color={theme.colors.text}
          />
        </TouchableOpacity>

        <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
          {category.name || "Category"}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowSortModal(true)}>
            <MaterialCommunityIcons
              name="sort"
              size={32}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Divider orientation="vertical" height={6} />
          <TouchableOpacity onPress={() => setShowFilterModal(true)}>
            <MaterialCommunityIcons
              name="filter-variant"
              size={32}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[styles.innerRow, { backgroundColor: theme.colors.background }]}
      >
        {/* Left: Subcategories */}
        <View
          style={[
            styles.leftColumn,
            {
              backgroundColor: theme.colors.surface,
              borderRightColor: theme.colors.border,
            },
          ]}
        >
          <FlatList
            data={subCategories}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.subCategoryButton,
                  selectedSubCategoryId === item.id && {
                    backgroundColor: "#E6EEF8",
                    borderLeftColor: "#2563EB",
                  },
                ]}
                onPress={() => setSelectedSubCategoryId(item.id)}
              >
                <Image
                  source={{
                    uri:
                      item.image ||
                      item.products[0]?.image ||
                      SUBCATEGORY_PLACEHOLDER_IMAGE,
                  }}
                  style={styles.subCategoryImage}
                />
                <Text
                  style={[styles.subCategoryText, { color: theme.colors.text }]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
          {/* Add some space at the bottom of the subcategory ending scrolllist */}
          <View style={{ height: 40 }} />
        </View>
        {/* Right: Products List */}
        {/* Here we need to show a tag on the product that require prescription should be shown on the product card as well */}
        <View style={styles.rightSection}>
          <FlatList
            ref={productsListRef}
            data={products}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.productList}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (hasMoreProductsPage && !isLoadingMoreProducts && !loading) {
                (async () => {
                  const loadMoreSeq = productsFetchSeqRef.current;
                  const pageToLoad = productsPage;
                  const currentSubcategoryId = selectedSubCategoryId;

                  try {
                    setIsLoadingMoreProducts(true);

                    const isPharmaCategory =
                      isPharma ||
                      category.type === "pharma" ||
                      category.name?.toLowerCase().includes("medicine") ||
                      category.name?.toLowerCase().includes("pharma");

                    let response;
                    if (isPharmaCategory) {
                      response =
                        await storeProductService.getPharmaProductsBySubcategoryPaged(
                          effectiveStore?.id || "",
                          selectedSubCategoryId || "",
                          pageToLoad,
                          PRODUCTS_PAGE_SIZE,
                        );
                    } else {
                      response =
                        await storeProductService.getGroceryProductsBySubcategoryPaged(
                          effectiveStore?.id || "",
                          selectedSubCategoryId || "",
                          pageToLoad,
                          PRODUCTS_PAGE_SIZE,
                        );
                    }

                    if (response.success && response.data) {
                      const nextProducts = response.data;
                      if (
                        loadMoreSeq === productsFetchSeqRef.current &&
                        currentSubcategoryId === selectedSubCategoryId
                      ) {
                        if (nextProducts.length > 0) {
                          setApiProducts((prev) => [
                            ...prev,
                            ...nextProducts,
                          ]);
                          setProductsPage((prev) => prev + 1);
                          const hasMore =
                            nextProducts.length === PRODUCTS_PAGE_SIZE;
                          setHasMoreProductsPage(hasMore);
                        } else {
                          // No more products from API
                          setHasMoreProductsPage(false);
                        }
                      }
                    } else {
                      if (loadMoreSeq === productsFetchSeqRef.current) {
                        setHasMoreProductsPage(false);
                      }
                    }
                  } catch (error) {
                    console.error(
                      "🔍 CategoryDetailScreen: Error loading more products:",
                      error,
                    );
                    if (loadMoreSeq === productsFetchSeqRef.current) {
                      setHasMoreProductsPage(false);
                    }
                  } finally {
                    setIsLoadingMoreProducts(false);
                  }
                })();
              }
            }}
            ListFooterComponent={
              isLoadingMoreProducts ? (
                <View style={{ paddingVertical: 16, alignItems: "center" }}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.noProducts,
                      { color: theme.colors.secondary, marginTop: 8 },
                    ]}
                  >
                    Loading more...
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              loading ? (
                <View style={{ paddingVertical: 40, alignItems: "center" }}>
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.noProducts,
                      { color: theme.colors.secondary, marginTop: 12 },
                    ]}
                  >
                    Loading...
                  </Text>
                </View>
              ) : (
                <Text
                  style={[styles.noProducts, { color: theme.colors.secondary }]}
                >
                  No products available
                </Text>
              )
            }
            renderItem={({ item: product }) => {
              const selectedVariant =
                selectedVariants[product.id] ??
                (product.variants ? product.variants[0] : undefined);
              const isFav = isInWishlist(product.id);
              return (
                <TouchableOpacity
                  style={[
                    styles.productCardList,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      shadowColor: theme.colors.text,
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate("ProductDetail", { product })
                  }
                  activeOpacity={0.85}
                >
                  {/* Top section: left text, right image */}
                  <View style={styles.productInfoContainer}>
                    <View style={styles.productImageColumn}>
                      <Image
                        source={{ uri: product.image }}
                        style={styles.productImageList}
                      />
                      {/* <TouchableOpacity style={styles.favBtnBelowImage} onPress={handleFavToggle(product)}>
                      <MaterialCommunityIcons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? theme.colors.primary : theme.colors.secondary} />
                    </TouchableOpacity> */}
                    </View>
                    <View style={styles.productTextColumn}>
                      <Text
                        style={[
                          styles.productName,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {product.name}
                      </Text>

                      {/* {(product.availableQty ||
                        selectedVariant?.stock !== undefined) && (
                        <Text style={styles.productSubtitle} numberOfLines={1}>
                          {product.availableQty || selectedVariant?.stock} Qty
                          Available
                        </Text>
                      )} */}
                      {product.prescriptionRequired && (
                        <View style={styles.rxTag}>
                          <Text style={styles.rxTagText}>Rx Required</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Bottom section: divider, variants, left add/counter, right price + stock */}
                  <View style={styles.productInfoList}>
                    <Divider orientation="horizontal" color={"#eee"} />
                    {product.variants && (
                      <View style={styles.productVariants}>
                        {product.variants.map(
                          (variant: {
                            id: string;
                            name: string;
                            price: number;
                            stock: number;
                          }) => (
                            <TouchableOpacity
                              key={variant.id}
                              style={[
                                styles.variantBtn,
                                {
                                  backgroundColor:
                                    selectedVariant?.id === variant.id
                                      ? theme.colors.primary
                                      : theme.colors.surface,
                                  borderColor:
                                    selectedVariant?.id === variant.id
                                      ? theme.colors.primary
                                      : theme.colors.border,
                                },
                              ]}
                              onPress={() =>
                                setSelectedVariants((prev) => ({
                                  ...prev,
                                  [product.id]: variant,
                                }))
                              }
                            >
                              <Text
                                style={{
                                  color:
                                    selectedVariant?.id === variant.id
                                      ? "#fff"
                                      : theme.colors.text,
                                  fontSize: 13,
                                }}
                              >
                                {variant.name}
                              </Text>
                            </TouchableOpacity>
                          ),
                        )}
                      </View>
                    )}

                    <View style={styles.bottomPriceSection}>
                      <View style={styles.priceCounterRow}>
                        <View
                          style={{
                            flexDirection: "column",
                            alignItems: "flex-start",
                            justifyContent: "flex-start",
                          }}
                        >
                          <View style={styles.priceRow}>
                            <Text style={[styles.productPrice]}>
                              ₹
                              {selectedVariant
                                ? selectedVariant.price.toFixed(2)
                                : Number(
                                    product.price || product.price || 0,
                                  ).toFixed(2)}
                            </Text>
                            {(() => {
                              const sp = selectedVariant
                                ? selectedVariant.price
                                : Number(product.price || product.price || 0);
                              const mrp = Number(product.originalPrice || 0);
                              const shouldShowOffer = sp > 0 && mrp > sp;
                              if (shouldShowOffer) {
                                const pct = Math.round(((mrp - sp) / mrp) * 100);
                                return (
                                  <Text style={styles.discountBadgeText}>
                                    {pct}% OFF
                                  </Text>
                                );
                              }
                              return null;
                            })()}
                          </View>
                          {/* Row 2: MRP */}
                          {(() => {
                            const sp = selectedVariant
                              ? selectedVariant.price
                              : Number(product.price || product.price || 0);
                            const mrp = Number(product.originalPrice || 0);
                            const shouldShowMrp = sp > 0 && mrp > sp;
                            if (shouldShowMrp) {
                              return (
                                <View style={styles.mrpRow}>
                                  <Text style={styles.mrpLabel}>MRP</Text>
                                  <Text
                                    style={[styles.mrpLabel, styles.strikeText]}
                                  >
                                    ₹{mrp.toFixed(2)}
                                  </Text>
                                </View>
                              );
                            }
                            return null;
                          })()}
                        </View>

                        {/* ADD / counter */}
                        <View style={styles.addButtonWrapper}>
                          {getCartQuantity(product.id) > 0 ? (
                            <View
                              style={[
                                styles.counterRow,
                                {
                                  backgroundColor: theme.colors.surface,
                                  borderColor: theme.colors.border,
                                },
                              ]}
                            >
                              <TouchableOpacity
                                onPress={() => {
                                  const currentQty = getCartQuantity(
                                    product.id,
                                  );
                                  const newQty = Math.max(0, currentQty - 1);
                                  const category = isPharma
                                    ? "pharma"
                                    : "grocery";
                                  updateQuantity(product.id, newQty, category);
                                }}
                                style={styles.counterBtnSmall}
                              >
                                <Text
                                  style={[
                                    styles.counterBtnTextSmall,
                                    { color: theme.colors.primary },
                                  ]}
                                >
                                  -
                                </Text>
                              </TouchableOpacity>
                              <Text
                                style={[
                                  styles.counterValueSmall,
                                  { color: theme.colors.primary },
                                ]}
                              >
                                {getCartQuantity(product.id)}
                              </Text>
                              <TouchableOpacity
                                onPress={() => {
                                  const currentQty = getCartQuantity(
                                    product.id,
                                  );
                                  const category = isPharma
                                    ? "pharma"
                                    : "grocery";
                                  const cartItems = isPharma
                                    ? pharmacyItems
                                    : groceryItems;
                                  const existing = cartItems.find(
                                    (item) => item.id === product.id,
                                  );
                                  if (existing)
                                    updateQuantity(
                                      product.id,
                                      currentQty + 1,
                                      category,
                                    );
                                  else if (isPharma)
                                    addToPharmacyCart({
                                      id: product.id,
                                      name: product.name,
                                      price: product.price,
                                      image: product.image,
                                      productId:
                                        (product as any).productId ||
                                        product.id,
                                      prescriptionRequired:
                                        product.prescriptionRequired || false,
                                    });
                                  else
                                    addToGroceryCart({
                                      id: product.id,
                                      name: product.name,
                                      price: product.price,
                                      image: product.image,
                                      productId:
                                        (product as any).productId ||
                                        product.id,
                                      prescriptionRequired:
                                        product.prescriptionRequired || false,
                                    });
                                }}
                                style={styles.counterBtnSmall}
                              >
                                <Text
                                  style={[
                                    styles.counterBtnTextSmall,
                                    { color: theme.colors.primary },
                                  ]}
                                >
                                  +
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            canAddToCart(product) && (
                              <TouchableOpacity
                                style={[
                                  styles.addBtn,
                                  {
                                    backgroundColor: theme.colors.primary,
                                    shadowColor: theme.colors.primary,
                                  },
                                ]}
                                onPress={() => {
                                  if (!canAddToCart(product)) return;
                                  const category = isPharma
                                    ? "pharma"
                                    : "grocery";
                                  if (isPharma)
                                    addToPharmacyCart({
                                      id: product.id,
                                      name: product.name,
                                      price: product.price,
                                      image: product.image,
                                      productId:
                                        (product as any).productId ||
                                        product.id,
                                      prescriptionRequired:
                                        product.prescriptionRequired || false,
                                    });
                                  else
                                    addToGroceryCart({
                                      id: product.id,
                                      name: product.name,
                                      price: product.price,
                                      image: product.image,
                                      productId:
                                        (product as any).productId ||
                                        product.id,
                                      prescriptionRequired:
                                        product.prescriptionRequired || false,
                                    });
                                }}
                              >
                                <Text style={styles.addBtnText}>Add</Text>
                              </TouchableOpacity>
                            )
                          )}
                        </View>
                      </View>

                      <Divider orientation="horizontal" color={"#eee"} />

                      {/* Row 3: stock status */}
                      <Text
                        style={[
                          styles.stockText,
                          {
                            color: theme.colors.primary,
                          },
                        ]}
                      >
                        {canAddToCart(product) ? "In Stock" : "Out of Stock"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
      {/* Filter Modal Sheet */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: theme.colors.text + "55" }}
          onPress={() => setShowFilterModal(false)}
        />
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#fff",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            minHeight: 480,
            maxHeight: height * 0.85,
          }}
        >
          {/* Top Bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#eee",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#222" }}>
              Filters
            </Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#222" />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", flex: 1 }}>
            {/* Left: Tabs */}
            <View
              style={{
                width: 110,
                backgroundColor: "#F8F8F8",
                borderRightWidth: 1,
                borderRightColor: "#eee",
                paddingVertical: 8,
              }}
            >
              {filterTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 10,
                    backgroundColor:
                      selectedFilterTab === tab.key ? "#fff" : "transparent",
                    borderLeftWidth: 3,
                    borderLeftColor:
                      selectedFilterTab === tab.key ? "#1A7B50" : "transparent",
                  }}
                  onPress={() => setSelectedFilterTab(tab.key)}
                >
                  <Text
                    style={{
                      color: selectedFilterTab === tab.key ? "#1A7B50" : "#222",
                      fontWeight:
                        selectedFilterTab === tab.key ? "bold" : "normal",
                      fontSize: 15,
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Right: Filter Options */}
            <View style={{ flex: 1, padding: 16 }}>
              {selectedFilterTab === "Brand" && (
                <>
                  <View
                    style={{
                      backgroundColor: "#F4F4F4",
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 12,
                      paddingHorizontal: 12,
                      width: "100%",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="magnify"
                      size={20}
                      color="#888"
                    />
                    <TextInput
                      style={{
                        flex: 1,
                        height: 40,
                        fontSize: 16,
                        marginLeft: 8,
                        paddingHorizontal: 4,
                      }}
                      placeholder="Search brands..."
                      placeholderTextColor="#aaa"
                      value={brandSearch}
                      onChangeText={setBrandSearch}
                    />
                  </View>
                  <ScrollView style={{ maxHeight: 260 }}>
                    {allBrands
                      .filter((b) =>
                        b.toLowerCase().includes(brandSearch.toLowerCase()),
                      )
                      .map((brand) => (
                        <TouchableOpacity
                          key={brand}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 10,
                          }}
                          onPress={() => {
                            setSelectedBrands((prev) =>
                              prev.includes(brand)
                                ? prev.filter((b) => b !== brand)
                                : [...prev, brand],
                            );
                          }}
                        >
                          <MaterialCommunityIcons
                            name={
                              selectedBrands.includes(brand)
                                ? "checkbox-marked"
                                : "checkbox-blank-outline"
                            }
                            size={22}
                            color={
                              selectedBrands.includes(brand)
                                ? "#1A7B50"
                                : "#888"
                            }
                            style={{ marginRight: 12 }}
                          />
                          <Text style={{ color: "#222", fontSize: 15 }}>
                            {brand}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </>
              )}
              {/* Add similar blocks for other tabs (Type, AtteType, Quantity, DietPref) as needed */}
            </View>
          </View>
          {/* Bottom Buttons */}
          <View
            style={{
              flexDirection: "row",
              borderTopWidth: 1,
              borderTopColor: "#eee",
              padding: 12,
              backgroundColor: "#fff",
              paddingBottom: 20 + insets.bottom,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "#F4F4F4",
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
                marginRight: 8,
              }}
              onPress={clearAllFilters}
            >
              <Text style={{ color: "#888", fontWeight: "bold", fontSize: 15 }}>
                Clear filters
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "#1A7B50",
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
              }}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Sort Modal Sheet */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: theme.colors.text + "55" }}
          onPress={() => setShowSortModal(false)}
        />
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: 24,
            minHeight: 220,
            paddingBottom: 20 + insets.bottom,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: theme.colors.text,
              }}
            >
              Sort By
            </Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <MaterialCommunityIcons
                name="close"
                size={26}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              }}
              onPress={() => {
                setSortBy(option.key as any);
                setShowSortModal(false);
              }}
            >
              <MaterialCommunityIcons
                name={sortBy === option.key ? "check-circle" : "circle-outline"}
                size={22}
                color={
                  sortBy === option.key
                    ? theme.colors.primary
                    : theme.colors.text
                }
                style={{ marginRight: 12 }}
              />
              <Text
                style={{
                  color: theme.colors.text,
                  fontWeight: sortBy === option.key ? "bold" : "normal",
                  fontSize: 16,
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 0,
  },
  categoryTitle: {
    fontWeight: "bold",
    fontSize: 20,
    color: "#222",
    flex: 1,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterSortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 10,
  },
  filterSortBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  filterSortText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#222",
  },
  backBtn: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  innerRow: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f7f7f7",
  },
  leftColumn: {
    width: LEFT_COLUMN_WIDTH,
    backgroundColor: "#F3F4F6",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    paddingTop: 12,
    paddingBottom: 12,
  },
  subCategoryButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    marginBottom: 6,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
  },
  subCategoryButtonActive: {
    backgroundColor: "#f0f6ff",
    borderLeftColor: "#00b14f",
  },
  subCategoryImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    resizeMode: "cover",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  subCategoryText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    color: "#374151",
    lineHeight: 16,
  },
  rightSection: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: "#F3F4F6",
  },
  productList: {
    paddingBottom: 30,
  },
  productCardList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productInfoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  productTextColumn: {
    flex: 1,
    paddingHorizontal: 8,
    marginLeft: 8,
    gap: 4,
  },
  productImageColumn: {
    width: 70,
    alignItems: "flex-end",
    paddingTop: 2,
  },
  productImageList: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    resizeMode: "contain",
  },
  favBtnBelowImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  productInfoList: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  productSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  strikeText: {
    textDecorationLine: "line-through",
  },
  mrpTextWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountBadgeText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#666666",
  },

  productVariants: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
    gap: 6,
  },
  variantBtn: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
    backgroundColor: "#f7f7f7",
  },
  selectedVariantBtn: {
    borderColor: "#00b14f",
    backgroundColor: "#00b14f11",
  },
  qtyText: {
    fontSize: 12,
    color: "#888",
    marginLeft: 8,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  stockText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
  },
  bottomPriceSection: {
    marginTop: 8,
  },
  priceCounterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  mrpRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  mrpLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    marginRight: 4,
  },
  rxTag: {
    alignSelf: "flex-start",
    backgroundColor: "#F5D5D5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 6,
  },
  rxTagText: {
    color: "#A17303",
    fontSize: 10,
    fontWeight: "600",
  },
  addButtonWrapper: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    paddingHorizontal: 6,
  },
  counterBtnSmall: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnTextSmall: {
    fontSize: 16,
    fontWeight: "600",
  },
  counterValueSmall: {
    width: 24,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#1E40AF",
  },
  favBtn: {
    marginLeft: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  noProducts: {
    color: "#888",
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
  },
  addRowList: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
    flexWrap: "nowrap",
  },
  priceInfoWrapper: {
    alignItems: "flex-end",
    justifyContent: "center",
    flexShrink: 1,
  },
  addBtn: {
    flex: 1,
    maxWidth: "100%",
    borderRadius: 10,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
});

export default CategoryDetailScreen;
