import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
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
import HorizontallyScrollableSection from "../../components/layout/HorizontallyScrollableSection";
import { useAppContext } from "../../contexts/AppContext";
import { useCart } from "../../contexts/CartContext";
import { useTheme } from "../../contexts/ThemeContext";
import { RootStackParamList } from "../../navigation/types";
import storeService from "../../services/api/storeService";
import { useVoiceSearch } from "../../hooks/useVoiceSearch";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number) =>
  (Dimensions.get("window").height / 812) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const PRODUCTS_PAGE_SIZE = 10;
const MAX_PRODUCTS = 1000;
const MAX_SEARCH_HISTORY = 10;

type SearchScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SearchScreen"
>;

type SearchScreenRouteProp = RouteProp<RootStackParamList, "SearchScreen">;

interface SearchResult {
  categories: any[];
  subcategories: any[];
  products: any[];
}

const SearchScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const route = useRoute<SearchScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const {
    selectedStore,
    lastVisitedStore,
    lastVisitedGroceryStore,
    lastVisitedPharmacyStore,
  } = useAppContext();
  const {
    totalItems,
    addToGroceryCart,
    addToPharmacyCart,
    updateQuantity,
    groceryItems,
    pharmacyItems,
  } = useCart();

  // Get the effective store to use (selectedStore or fallback to last visited stores)
  const effectiveStore =
    selectedStore ||
    lastVisitedStore ||
    lastVisitedGroceryStore ||
    lastVisitedPharmacyStore;
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [productsPageSize, setProductsPageSize] = useState(PRODUCTS_PAGE_SIZE);
  console.log("productsPageSize", productsPageSize);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreFromApi, setHasMoreFromApi] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreTriggered = React.useRef(false);

  const shouldAutoFocus = route.params?.autoFocus ?? false;
  const shouldVoiceSearch = route.params?.voiceSearch ?? false;

  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
  } = useVoiceSearch();

  // Auto-start voice recognition when navigated with voiceSearch param
  const voiceStartedRef = React.useRef(false);
  useEffect(() => {
    if (shouldVoiceSearch && !voiceStartedRef.current) {
      voiceStartedRef.current = true;
      const timer = setTimeout(() => startListening(), 400);
      return () => clearTimeout(timer);
    }
  }, [shouldVoiceSearch, startListening]);

  // When voice transcript changes, set it as search query and trigger search
  useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript);
      handleSearchSubmit(transcript);
    }
  }, [transcript]);

  // Load search history from local storage - limit to 10 items
  useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        const savedSearches = await AsyncStorage.getItem("searchHistory");
        if (savedSearches) {
          const parsed = JSON.parse(savedSearches);
          // Ensure only latest MAX_SEARCH_HISTORY items are loaded
          const limited = Array.isArray(parsed)
            ? parsed.slice(0, MAX_SEARCH_HISTORY)
            : [];
          setRecentSearches(limited);
          // Update storage if we had to limit
          if (parsed.length > MAX_SEARCH_HISTORY) {
            await saveSearchHistory(limited);
          }
        }
      } catch (error) {
        console.error("Error loading search history:", error);
      }
    };
    loadSearchHistory();
  }, []);

  // Save search history to local storage
  const saveSearchHistory = async (searches: string[]) => {
    try {
      await AsyncStorage.setItem("searchHistory", JSON.stringify(searches));
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || !effectiveStore?.id) {
        setSearchResults(null);
        setSearchError(null);
        setSearchPage(1);
        setHasMoreFromApi(false);
        return;
      }

      try {
        setIsSearching(true);
        setSearchError(null);
        console.log("🔍 Searching for:", query, "in store:", effectiveStore.id);

        const response = await storeService.searchStoreProducts(
          effectiveStore.id,
          query,
          1,
          PRODUCTS_PAGE_SIZE,
        );

        console.log("🔍 Full API response:", JSON.stringify(response, null, 2));

        if (response.success && response.data) {
          console.log(
            "🔍 Search results data:",
            JSON.stringify(response.data, null, 2),
          );
          // Support both shapes: { data: {...} } and { data: { data: {...} } }
          const searchData = (response as any)?.data?.data ?? response.data;
          console.log(
            "🔍 Processed search data:",
            JSON.stringify(searchData, null, 2),
          );

          const initialProducts = Array.isArray(searchData.products)
            ? searchData.products
            : [];

          // Log detailed breakdown
          console.log("📊 === SEARCH RESULTS BREAKDOWN ===");
          console.log("📊 Categories:", searchData.categories?.length || 0);
          if (searchData.categories?.length > 0) {
            console.log(
              "📊 Category names:",
              searchData.categories.map((c: any) => c.name),
            );
          }
          console.log(
            "📊 Subcategories:",
            searchData.subcategories?.length || 0,
          );
          if (searchData.subcategories?.length > 0) {
            console.log(
              "📊 Subcategory names:",
              searchData.subcategories.map((s: any) => s.name),
            );
          }
          if (initialProducts.length > 0) {
            console.log(
              "📊 Product names:",
              initialProducts.map((p: any) => p.name),
            );
          }
          console.log("📊 === END BREAKDOWN ===");

          // Set initial page data and pagination flags
          setSearchResults({
            ...searchData,
            products: initialProducts,
          });
          setProductsPageSize(
            Math.min(
              initialProducts.length || PRODUCTS_PAGE_SIZE,
              MAX_PRODUCTS,
            ),
          );
          const hasMore = initialProducts.length >= PRODUCTS_PAGE_SIZE;
          setHasMoreFromApi(hasMore);
          setSearchPage(hasMore ? 2 : 1);
          loadMoreTriggered.current = false;
        } else {
          console.error("❌ Search failed:", response.error);
          setSearchError(response.error || "Search failed");
          setSearchResults(null);
        }
      } catch (error) {
        console.error("❌ Search error:", error);
        setSearchError("Failed to search products");
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [effectiveStore?.id],
  );

  const allProducts = searchResults?.products ?? [];
  const displayedProducts = useMemo(
    () => allProducts.slice(0, Math.min(productsPageSize, MAX_PRODUCTS)),
    [allProducts, productsPageSize],
  );
  console.log("displayedProducts", displayedProducts);
  const hasMoreProducts =
    hasMoreFromApi ||
    displayedProducts.length < Math.min(allProducts.length, MAX_PRODUCTS);
  const loadMoreProducts = useCallback(async () => {
    if (
      !effectiveStore?.id ||
      !searchQuery.trim() ||
      isSearching ||
      isLoadingMore ||
      !hasMoreFromApi
    ) {
      return;
    }

    try {
      setIsLoadingMore(true);

      const response = await storeService.searchStoreProducts(
        effectiveStore.id,
        searchQuery,
        searchPage,
        PRODUCTS_PAGE_SIZE,
      );

      if (response.success && response.data) {
        const searchDataPage = (response as any)?.data?.data ?? response.data;
        const nextProducts = Array.isArray(searchDataPage.products)
          ? searchDataPage.products
          : [];

        setSearchResults((prev) => {
          if (!prev) {
            return {
              categories: searchDataPage.categories || [],
              subcategories: searchDataPage.subcategories || [],
              products: nextProducts,
            };
          }

          const mergedProducts = [...(prev.products ?? []), ...nextProducts];

          return {
            ...prev,
            products: mergedProducts,
          };
        });

        // Increase the number of products shown
        setProductsPageSize((prev) =>
          Math.min(
            prev + (nextProducts.length || PRODUCTS_PAGE_SIZE),
            MAX_PRODUCTS,
          ),
        );

        if (nextProducts.length >= PRODUCTS_PAGE_SIZE) {
          setSearchPage((prev) => prev + 1);
          setHasMoreFromApi(true);
        } else {
          setHasMoreFromApi(false);
        }
      } else {
        console.error("❌ Load more search failed:", response.error);
        setHasMoreFromApi(false);
      }
    } catch (error) {
      console.error("❌ Load more search error:", error);
      setHasMoreFromApi(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    effectiveStore?.id,
    searchQuery,
    searchPage,
    isSearching,
    isLoadingMore,
    hasMoreFromApi,
  ]);

  const cartType = effectiveStore?.type === "pharma" ? "pharma" : "grocery";
  const cartItems = cartType === "pharma" ? pharmacyItems : groceryItems;
  const getValidQty = (p: any) =>
    Math.max(0, parseInt(String(p.quantity ?? p.availableQty ?? 0), 10) || 0);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Only trigger search, don't add to history yet
    debouncedSearch(query);
  };

  const handleSearchSubmit = (query: string) => {
    console.log("🔍 Search submitted:", query);

    if (query.trim()) {
      const trimmedQuery = query.trim().toLowerCase();
      let newSearches: string[];

      // If already exists, remove it first to move to top
      if (recentSearches.includes(trimmedQuery)) {
        newSearches = [
          trimmedQuery,
          ...recentSearches.filter((s) => s !== trimmedQuery),
        ];
      } else {
        // Add new search to top, keep only latest MAX_SEARCH_HISTORY
        newSearches = [trimmedQuery, ...recentSearches].slice(
          0,
          MAX_SEARCH_HISTORY,
        );
      }

      setRecentSearches(newSearches);
      saveSearchHistory(newSearches);
      console.log(
        "🔍 Updated search history:",
        trimmedQuery,
        "Total:",
        newSearches.length,
      );
    }

    // Trigger search
    debouncedSearch(query);
  };

  const handleSearchResultTap = (searchTerm: string) => {
    console.log("🔍 Search result tapped:", searchTerm);

    // Add to search history when user taps on a result
    if (searchTerm.trim()) {
      const trimmedQuery = searchTerm.trim().toLowerCase();
      let newSearches: string[];

      // If already exists, remove it first to move to top
      if (recentSearches.includes(trimmedQuery)) {
        newSearches = [
          trimmedQuery,
          ...recentSearches.filter((s) => s !== trimmedQuery),
        ];
      } else {
        // Add new search to top, keep only latest MAX_SEARCH_HISTORY
        newSearches = [trimmedQuery, ...recentSearches].slice(
          0,
          MAX_SEARCH_HISTORY,
        );
      }

      setRecentSearches(newSearches);
      saveSearchHistory(newSearches);
      console.log(
        "🔍 Updated search history from result tap:",
        trimmedQuery,
        "Total:",
        newSearches.length,
      );
    }
  };

  // Debounce utility function
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    await saveSearchHistory([]);
  };

  const handleCategoryPress = async (category: any) => {
    console.log(
      "🔍 Navigating to category:",
      category.name,
      "ID:",
      category.categoryId,
    );

    // Add current search query to history since user tapped on a result
    handleSearchResultTap(searchQuery);

    // Fetch subcategories and products for this category
    try {
      console.log("🔍 Fetching category details for:", category.categoryId);
      const categoryResponse = await storeService.getCategoryDetails(
        selectedStore?.id || "",
        category.categoryId,
      );
      console.log(
        "🔍 Category details API response:",
        JSON.stringify(categoryResponse, null, 2),
      );

      if (categoryResponse.success && categoryResponse.data) {
        // Support both shapes
        const categoryData =
          (categoryResponse as any)?.data?.data ?? categoryResponse.data;
        console.log(
          "🔍 Category details fetched:",
          JSON.stringify(categoryData, null, 2),
        );

        navigation.navigate("CategoryDetail", {
          category: {
            id: category.categoryId,
            name: category.name,
            description: category.description,
            image: category.image,
            _id: category._id,
            categoryERPId: category.categoryERPId,
            status: category.status,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
            subCategories: categoryData.subcategories || [],
            products: categoryData.products || [],
          },
        });
      } else {
        // Fallback if API fails - navigate with empty subcategories
        console.log(
          "⚠️ Category details API failed, navigating with empty subcategories...",
        );
        navigation.navigate("CategoryDetail", {
          category: {
            id: category.categoryId,
            name: category.name,
            description: category.description,
            image: category.image,
            _id: category._id,
            categoryERPId: category.categoryERPId,
            status: category.status,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
            subCategories: [], // Empty - CategoryDetailScreen will fetch only this category's subcategories
            products: [], // Empty - CategoryDetailScreen will fetch only this category's products
          },
        });
      }
    } catch (error) {
      console.error("🔍 Error fetching category details:", error);
      // Fallback navigation
      navigation.navigate("CategoryDetail", {
        category: {
          id: category.categoryId,
          name: category.name,
          description: category.description,
          image: category.image,
          _id: category._id,
          categoryERPId: category.categoryERPId,
          status: category.status,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
          subCategories: [],
          products: [],
        },
      });
    }
  };

  const handleSubcategoryPress = async (subcategory: any) => {
    console.log(
      "🔍 Navigating to subcategory:",
      subcategory.name,
      "ID:",
      subcategory.subcategoryId,
    );
    console.log("🔍 Parent category ID:", subcategory.categoryId);

    // Add current search query to history since user tapped on a result
    handleSearchResultTap(searchQuery);

    // Navigate directly to category page with only this specific subcategory
    // The CategoryDetailScreen will handle fetching products for this subcategory
    navigation.navigate("CategoryDetail", {
      category: {
        id: subcategory.categoryId, // Parent category ID
        name:
          subcategory.categoryName || subcategory.category?.name || "Products",
        description:
          subcategory.description || subcategory.category?.description,
        image: subcategory.image || subcategory.category?.image,
        _id: subcategory._id,
        categoryERPId: subcategory.categoryERPId,
        status: subcategory.status,
        createdAt: subcategory.createdAt,
        updatedAt: subcategory.updatedAt,
        subCategories: [], // Empty - CategoryDetailScreen will fetch subcategories
        products: [], // Empty - CategoryDetailScreen will fetch products for this subcategory
        selectedSubcategoryId: subcategory.subcategoryId, // Pre-select this specific subcategory
      },
    });
  };

  const handleRecentSearchPress = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    // Move this search to top of history when user taps on it
    const trimmedQuery = searchTerm.trim().toLowerCase();
    let newSearches: string[];

    if (recentSearches.includes(trimmedQuery)) {
      // Move to top if already exists
      newSearches = [
        trimmedQuery,
        ...recentSearches.filter((s) => s !== trimmedQuery),
      ];
    } else {
      // Add new if doesn't exist, keep only latest MAX_SEARCH_HISTORY
      newSearches = [trimmedQuery, ...recentSearches].slice(
        0,
        MAX_SEARCH_HISTORY,
      );
    }

    setRecentSearches(newSearches);
    saveSearchHistory(newSearches);
    debouncedSearch(searchTerm);
  };

  const styles = StyleSheet.create({
    headerContainer: {
      zIndex: 100,
    },
    headerMain: {
      paddingTop: Platform.OS === "android" ? 5 : 0,
      paddingBottom: verticalScale(16),
      borderBottomLeftRadius: scale(20),
      borderBottomRightRadius: scale(20),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: scale(16),
      paddingTop: verticalScale(8),
      gap: scale(2),
    },
    backButton: {
      padding: scale(4),
      justifyContent: "center",
      alignItems: "center",
    },
    searchBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 50,
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(6),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    searchInput: {
      flex: 1,
      fontSize: moderateScale(14),
      color: "#1E1E1E",
      marginLeft: scale(10),
      paddingVertical: 0,
      includeFontPadding: false,
      textAlignVertical: "center",
    },
    searchPlaceholder: {
      flex: 1,
      fontSize: moderateScale(14),
      color: "#9E9E9E",
      marginLeft: scale(10),
    },
    searchMicButton: {
      padding: scale(4),
    },
    headerIconButton: {
      padding: scale(8),
      position: "relative",
    },
    cartBadge: {
      position: "absolute",
      right: 0,
      top: 0,
      backgroundColor: "#FF5252",
      borderRadius: scale(10),
      minWidth: scale(18),
      height: scale(18),
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: scale(4),
    },
    cartBadgeText: {
      color: "#FFFFFF",
      fontSize: moderateScale(10),
      fontWeight: "bold",
    },
    safeArea: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: scale(16),
      paddingTop: verticalScale(16),
      marginBottom: 16,
    },
    bottomModalWrapper: {
      flex: 1,
      justifyContent: "flex-end",
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: verticalScale(12),
    },

    sectionTitle: {
      fontSize: moderateScale(16),
      fontWeight: "700",
      color: "#1E1E1E",
    },

    clearButtonText: {
      fontSize: moderateScale(14),
      color: theme.colors.primary,
      fontWeight: "600",
    },

    recentSearchItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: verticalScale(10),
      borderBottomWidth: 1,
      borderBottomColor: "#F2F2F2",
    },

    recentSearchItemText: {
      flex: 1,
      fontSize: moderateScale(14),
      color: "#1E1E1E",
      marginLeft: scale(12),
    },
    productsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    productCard: {
      width: "48%",
      minHeight: 220,
      backgroundColor: "#fff",
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: "#f0f0f0",
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 6,
      alignItems: "center",
      justifyContent: "flex-start",
      marginBottom: 16,
    },
    viewAllButton: {
      alignItems: "center",
      paddingVertical: 12,
      marginTop: 8,
    },
    viewAllText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 16,
    },
    searchResultsContainer: {
      flex: 1,
    },
    resultsCount: {
      fontSize: moderateScale(14),
      color: "#666666",
      marginBottom: verticalScale(16),
      fontWeight: "500",
    },
    categoryItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: scale(12),
      backgroundColor: "#FFFFFF",
      borderRadius: scale(8),
      marginBottom: scale(8),
      borderWidth: 1,
      borderColor: "#F0F0F0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    categoryImage: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      backgroundColor: "#f0f0f0",
      marginRight: scale(12),
    },
    categoryText: {
      flex: 1,
      fontSize: moderateScale(16),
      color: "#1E1E1E",
      fontWeight: "500",
    },
    categoriesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: verticalScale(48),
    },
    categoryGridItem: {
      width: (SCREEN_WIDTH - scale(48)) / 3,
      backgroundColor: "#FFFFFF",
      borderRadius: scale(12),
      padding: scale(12),
      marginBottom: verticalScale(12),
      borderWidth: 1,
      borderColor: "#F0F0F0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      alignItems: "center",
    },
    categoryGridImage: {
      width: scale(50),
      height: scale(50),
      borderRadius: scale(25),
      backgroundColor: "#f0f0f0",
      marginBottom: scale(8),
    },
    categoryGridText: {
      fontSize: moderateScale(12),
      color: "#1E1E1E",
      fontWeight: "500",
      textAlign: "center",
      lineHeight: moderateScale(16),
    },
    // Remove duplicate keys below; keep a single productsGrid/productCard definition
    loadingContainer: {
      padding: scale(20),
      alignItems: "center",
    },
    loadingText: {
      fontSize: moderateScale(14),
      color: "#666666",
      marginTop: verticalScale(8),
    },
    errorContainer: {
      padding: scale(20),
      alignItems: "center",
    },
    errorText: {
      fontSize: moderateScale(14),
      color: theme.colors.error,
      textAlign: "center",
      marginTop: verticalScale(8),
    },
    noResultsContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(40),
    },
    noResultsText: {
      fontSize: moderateScale(16),
      color: "#666666",
      textAlign: "center",
      marginTop: verticalScale(16),
    },
  });

  const isPharmacyStore = effectiveStore?.type === "pharma";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* Header with Search - Matching HomeScreen */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={theme.gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerMain}
          >
            {/* Back Button and Search Bar in One Row */}
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons
                  name="arrow-back"
                  size={scale(24)}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <View style={styles.searchBar}>
                <Ionicons name="search" size={scale(24)} color="#9E9E9E" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={
                    isPharmacyStore ? "Search medicines" : "Search groceries"
                  }
                  placeholderTextColor="#9E9E9E"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  onSubmitEditing={() => handleSearchSubmit(searchQuery)}
                  autoFocus={shouldAutoFocus}
                  returnKeyType="search"
                  numberOfLines={1}
                />
                <TouchableOpacity
                  style={styles.searchMicButton}
                  onPress={() => {
                    if (isListening) {
                      stopListening();
                    } else {
                      startListening();
                    }
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name={isListening ? "microphone" : "microphone-outline"}
                    size={scale(24)}
                    color={isListening ? "#FF5252" : theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
              {/* Cart Button */}
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => navigation.navigate("Cart")}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="cart-outline"
                  size={scale(24)}
                  color="#FFFFFF"
                />
                {totalItems > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {totalItems > 99 ? "99+" : totalItems}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Voice listening indicator */}
          {isListening && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: verticalScale(8),
                paddingHorizontal: scale(16),
                backgroundColor: "#FFF3F3",
              }}
            >
              <MaterialCommunityIcons
                name="microphone"
                size={scale(18)}
                color="#FF5252"
              />
              <Text
                style={{
                  marginLeft: scale(8),
                  fontSize: moderateScale(13),
                  fontWeight: "600",
                  color: "#FF5252",
                }}
              >
                Listening...
              </Text>
              <TouchableOpacity
                onPress={stopListening}
                style={{ marginLeft: "auto" }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={{
                    fontSize: moderateScale(13),
                    fontWeight: "600",
                    color: "#FF5252",
                  }}
                >
                  Stop
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } =
              e.nativeEvent;
            const padding = 400;
            if (
              hasMoreProducts &&
              contentSize.height - layoutMeasurement.height - contentOffset.y <
                padding &&
              !loadMoreTriggered.current
            ) {
              loadMoreTriggered.current = true;
              loadMoreProducts();
              setTimeout(() => {
                loadMoreTriggered.current = false;
              }, 800);
            }
          }}
          scrollEventThrottle={200}
        >
          {/* Show search results if searching or has results */}
          {searchQuery.trim() ? (
            <View style={styles.searchResultsContainer}>
              {/* Loading State */}
              {isSearching && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                  />
                  <Text style={styles.loadingText}>
                    Searching for "{searchQuery}"...
                  </Text>
                </View>
              )}

              {/* Error State */}
              {searchError && !isSearching && (
                <View style={styles.errorContainer}>
                  <MaterialIcons
                    name="error-outline"
                    size={48}
                    color={theme.colors.error}
                  />
                  <Text style={styles.errorText}>{searchError}</Text>
                </View>
              )}

              {/* Search Results */}
              {searchResults && !isSearching && (
                <>
                  {(() => {
                    const totalResults =
                      (searchResults.categories?.length || 0) +
                      (searchResults.subcategories?.length || 0) +
                      (searchResults.products?.length || 0);

                    if (totalResults === 0) {
                      return (
                        <View style={styles.noResultsContainer}>
                          <MaterialIcons
                            name="search-off"
                            size={64}
                            color={theme.colors.secondary}
                          />
                          <Text style={styles.noResultsText}>
                            No results found for "{searchQuery}"
                          </Text>
                        </View>
                      );
                    }

                    return (
                      <>
                        <Text style={styles.resultsCount}>
                          {totalResults} results for "{searchQuery}"
                        </Text>

                        {/* Products - Using HorizontallyScrollableSection like HomeScreen */}
                        {searchResults.products &&
                          searchResults.products.length > 0 && (
                            <View style={{ marginBottom: verticalScale(32) }}>
                              <Text style={styles.sectionTitle}>Products</Text>
                              <HorizontallyScrollableSection
                                title=""
                                itemsOverride={displayedProducts.map(
                                  (p: any) => ({
                                    ...p,
                                    id: p.productId || p._id || p.id,
                                    name:
                                      p.name ||
                                      p.fullName ||
                                      p.productName ||
                                      "Product",
                                    price: parseFloat(p.sp || p.mrp || "0"),
                                    originalPrice: parseFloat(p.mrp || "0"),
                                    image:
                                      p.signedImage ||
                                      p.image ||
                                      (Array.isArray(p.signedImages) &&
                                      p.signedImages.length > 0
                                        ? p.signedImages[0]
                                        : undefined) ||
                                      (Array.isArray(p.images) &&
                                      p.images.length > 0
                                        ? p.images[0]
                                        : undefined) ||
                                      "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg",
                                    category: isPharmacyStore
                                      ? "pharma"
                                      : "grocery",
                                    prescriptionRequired:
                                      p.prescriptionRequired || false,
                                    availableQty: getValidQty(p),
                                    productId: p.productId || p._id || p.id,
                                    perUnit: p.perUnit || p.unit || "",
                                  }),
                                )}
                                hidePercentOff
                                hideWishlist
                                showFullName
                                cardWidth={Math.min(SCREEN_WIDTH * 0.5, 180)}
                                orientation="vertical"
                                numColumns={2}
                              />
                              {hasMoreProducts &&
                                displayedProducts.length >=
                                  PRODUCTS_PAGE_SIZE && (
                                  <View style={styles.loadingContainer}>
                                    <ActivityIndicator
                                      size="small"
                                      color={theme.colors.primary}
                                    />
                                    <Text style={styles.loadingText}>
                                      Scroll for more
                                    </Text>
                                  </View>
                                )}
                            </View>
                          )}

                        {/* Categories - 3 Column Grid */}
                        {searchResults.categories &&
                          searchResults.categories.length > 0 && (
                            <>
                              <Text style={styles.sectionTitle}>
                                Categories
                              </Text>
                              <View style={styles.categoriesGrid}>
                                {searchResults.categories.map(
                                  (category: any, index: number) => {
                                    const categoryImage =
                                      category.signedImage ||
                                      category.image ||
                                      "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg";

                                    return (
                                      <TouchableOpacity
                                        key={category._id || index}
                                        style={styles.categoryGridItem}
                                        onPress={() =>
                                          handleCategoryPress(category)
                                        }
                                      >
                                        <Image
                                          source={{ uri: categoryImage }}
                                          style={styles.categoryGridImage}
                                          resizeMode="cover"
                                        />
                                        <Text
                                          style={styles.categoryGridText}
                                          numberOfLines={2}
                                        >
                                          {category.name}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  },
                                )}
                              </View>
                            </>
                          )}

                        {/* Subcategories - 2 Column Grid */}
                        {searchResults.subcategories &&
                          searchResults.subcategories.length > 0 && (
                            <>
                              <Text style={styles.sectionTitle}>
                                Subcategories
                              </Text>
                              <View style={styles.categoriesGrid}>
                                {searchResults.subcategories.map(
                                  (subcategory: any, index: number) => {
                                    const subcategoryImage =
                                      subcategory.signedImage ||
                                      subcategory.image ||
                                      "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg";

                                    return (
                                      <TouchableOpacity
                                        key={subcategory._id || index}
                                        style={styles.categoryGridItem}
                                        onPress={() =>
                                          handleSubcategoryPress(subcategory)
                                        }
                                      >
                                        <Image
                                          source={{ uri: subcategoryImage }}
                                          style={styles.categoryGridImage}
                                          resizeMode="cover"
                                        />
                                        <Text
                                          style={styles.categoryGridText}
                                          numberOfLines={2}
                                        >
                                          {subcategory.name}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  },
                                )}
                              </View>
                            </>
                          )}
                      </>
                    );
                  })()}
                </>
              )}
            </View>
          ) : (
            /* Show recent searches when not searching */
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={styles.bottomModalWrapper}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Searches</Text>
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text style={styles.clearButtonText}>Clear All</Text>
                    </TouchableOpacity>
                  </View>

                  {recentSearches
                    .slice(0, MAX_SEARCH_HISTORY)
                    .map((search, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.recentSearchItem,
                          index === recentSearches.length - 1 && {
                            borderBottomWidth: 0,
                          },
                        ]}
                        onPress={() => handleRecentSearchPress(search)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons
                          name="access-time"
                          size={scale(18)}
                          color="#9E9E9E"
                        />

                        <Text style={styles.recentSearchItemText}>
                          {search}
                        </Text>

                        <MaterialIcons
                          name="chevron-right"
                          size={scale(20)}
                          color="#C0C0C0"
                        />
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SearchScreen;
 