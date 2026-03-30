import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import BannerSlider from "../../components/common/BannerSlider";
import CategoryGrid from "../../components/common/CategoriesGrid";
import HorizontallyScrollableSection from "../../components/layout/HorizontallyScrollableSection";
import Drawer from "../../components/profile/ProfileDrawer";
import { useAppContext } from "../../contexts/AppContext";
import { useCart } from "../../contexts/CartContext";
import { useTheme } from "../../contexts/ThemeContext";
import { RootStackParamList } from "../../navigation/types";
import { storeProductService } from "../../services/api/storeProductService";
import { useAuth } from "../../contexts/AuthContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive scaling functions
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface StoreInfo {
  isOpen: boolean;
  deliveryTime: string;
  isCertified: boolean;
}

// Height of header content above the search bar - when scroll passes this, search bar sticks
const HEADER_ABOVE_SEARCH_ESTIMATE = verticalScale(118);

// Header Component with Blue Background
const Header = ({
  onProfilePress,
  onSearchPress,
  onMicPress,
  isDrawerVisible,
  storeInfo,
  onHeaderAboveSearchLayout,
  isPharmacyStore,
}: {
  onProfilePress: () => void;
  onSearchPress: () => void;
  onMicPress: () => void;
  isDrawerVisible: boolean;
  storeInfo: StoreInfo;
  onHeaderAboveSearchLayout?: (height: number) => void;
  isPharmacyStore: boolean;
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const {
    selectedStore,
    lastVisitedStore,
    lastVisitedGroceryStore,
    lastVisitedPharmacyStore,
  } = useAppContext();
  const { totalItems } = useCart();

  const displayStore =
    selectedStore ||
    lastVisitedStore ||
    lastVisitedGroceryStore ||
    lastVisitedPharmacyStore;

  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Main Header Section */}
      <LinearGradient
        colors={theme.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerMain}
      >
        {/* Top Row + Store Info - measure height for sticky threshold */}
        <View
          onLayout={
            onHeaderAboveSearchLayout
              ? (e) => onHeaderAboveSearchLayout(e.nativeEvent.layout.height)
              : undefined
          }
        >
          {/* Top Row - Menu, Title, Cart */}
          <View style={styles.headerTopRow}>
            {/* Menu Button */}
            <TouchableOpacity
              onPress={onProfilePress}
              style={styles.headerIconButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="menu"
                size={scale(26)}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* Center - Store Name */}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {displayStore?.name
                  ? displayStore.name.length > 25
                    ? `${displayStore.name.slice(0, 25)}...`
                    : displayStore.name
                  : "Select Store"}
              </Text>
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

          {/* Store Info Row - Open Status, Delivery Time, Certified */}
          {displayStore && (<></>
            // <View style={styles.storeInfoRow}>
            //   {/* Open/Closed Status */}
            //   <View style={styles.storeInfoItem}>
            //     <View
            //       style={[
            //         styles.statusDot,
            //         {
            //           backgroundColor: storeInfo.isOpen ? "#4CAF50" : "#F44336",
            //         },
            //       ]}
            //     />
            //     <Text style={styles.storeInfoText}>
            //       {storeInfo.isOpen ? "Open Now" : "Closed"}
            //     </Text>
            //   </View>

            //   {/* Divider */}
            //   <View style={styles.infoDivider} />

            //   {/* Delivery Time */}
            //   <View style={styles.storeInfoItem}>
            //     <Text style={styles.storeInfoText}>
            //       {storeInfo.deliveryTime}
            //     </Text>
            //   </View>

            //   {/* Divider */}
            //   <View style={styles.infoDivider} />

            //   {/* Certified Badge */}
            //   {storeInfo.isCertified && (
            //     <View style={styles.storeInfoItem}>
            //       <MaterialIcons
            //         name="verified"
            //         size={scale(14)}
            //         color="#4CAF50"
            //       />
            //       <Text style={styles.storeInfoText}>Certified</Text>
            //     </View>
            //   )}
            // </View>
          )}
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBarContainer}
          activeOpacity={0.9}
          onPress={onSearchPress}
        >
          <View style={styles.searchBar}>
            <Ionicons name="search" size={scale(24)} color="#9E9E9E" />
            <Text style={styles.searchPlaceholder}>
              {isPharmacyStore
                ? "Search medicines, health products..."
                : "Search groceries, daily essentials..."}
            </Text>
            <TouchableOpacity
              style={styles.searchMicButton}
              onPress={(e) => {
                e.stopPropagation();
                onMicPress();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="microphone-outline"
                size={scale(24)}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

// Sticky search bar shown when user scrolls past header (fixed at top)
const StickySearchBar = ({
  onSearchPress,
  onMicPress,
  isPharmacyStore,
}: {
  onSearchPress: () => void;
  onMicPress: () => void;
  isPharmacyStore: boolean;
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.stickySearchBarWrapper}>
      <LinearGradient
        colors={theme.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.stickySearchBarGradient}
      >
        <TouchableOpacity
          style={styles.searchBarContainer}
          activeOpacity={0.9}
          onPress={onSearchPress}
        >
          <View style={styles.searchBar}>
            <Ionicons name="search" size={scale(24)} color="#9E9E9E" />
            <Text style={styles.searchPlaceholder}>
              {isPharmacyStore
                ? "Search medicines, health products..."
                : "Search groceries, daily essentials..."}
            </Text>
            <TouchableOpacity
              style={styles.searchMicButton}
              onPress={(e) => {
                e.stopPropagation();
                onMicPress();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="microphone-outline"
                size={scale(24)}
                color={isPharmacyStore ? "#5B7CFA" : "#1E88E5"}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

// Main HomeScreen Component
const HomeScreen = () => {
  const { theme, section, setSection } = useTheme();
  const { isAuthenticated, token } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const {
    selectedStore,
    setSelectedStore,
    saveLastVisitedStore,
    lastVisitedStore,
    lastVisitedGroceryStore,
    lastVisitedPharmacyStore,
  } = useAppContext();

  // State
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [homeProducts, setHomeProducts] = useState<any[]>([]);
  const [homeProductsLoading, setHomeProductsLoading] =
    useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [headerAboveSearchHeight, setHeaderAboveSearchHeight] = useState(
    HEADER_ABOVE_SEARCH_ESTIMATE,
  );

  // Store info state (mock data - replace with actual API data)
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    isOpen: true,
    deliveryTime: "30-45 min",
    isCertified: true,
  });

  // Effective store calculation
  const effectiveStore =
    selectedStore ||
    lastVisitedPharmacyStore ||
    (lastVisitedStore?.type === "pharma" ? lastVisitedStore : null) ||
    lastVisitedStore ||
    lastVisitedGroceryStore;

  const isPharmacyStore = effectiveStore?.type === "pharma";
  const currentSection = isPharmacyStore
    ? "pharma"
    : effectiveStore?.type === "grocery"
      ? "grocery"
      : "pharma";

  const showStickySearch =
    !!effectiveStore && scrollY >= headerAboveSearchHeight;

  useEffect(() => {
    if (effectiveStore) {
      setSection(currentSection);
    } else {
      setSection("pharma");
    }
  }, [effectiveStore, currentSection, setSection]);

  useEffect(() => {
    if (!selectedStore) {
      if (lastVisitedPharmacyStore) {
        setSelectedStore(lastVisitedPharmacyStore);
      } else if (lastVisitedStore && lastVisitedStore.type === "pharma") {
        setSelectedStore(lastVisitedStore);
      } else if (lastVisitedStore) {
        setSelectedStore(lastVisitedStore);
      } else if (lastVisitedGroceryStore) {
        setSelectedStore(lastVisitedGroceryStore);
      }
    }
  }, [
    selectedStore,
    lastVisitedStore,
    lastVisitedGroceryStore,
    lastVisitedPharmacyStore,
    setSelectedStore,
  ]);

  useEffect(() => {
    if (selectedStore) {
      saveLastVisitedStore(selectedStore);
    }
  }, [selectedStore, saveLastVisitedStore]);

  // Fetch products
  const fetchHomeProducts = useCallback(
    async (isRefresh = false) => {
      const storeToUse = effectiveStore;
      if (!storeToUse?.id) {
        setHomeProducts([]);
        return;
      }

      try {
        if (!isRefresh) {
          setHomeProductsLoading(true);
        }

        const resp = isPharmacyStore
          ? await storeProductService.getPharmaProducts(storeToUse.id)
          : await storeProductService.getGroceryProducts(storeToUse.id);

        if (resp.success && Array.isArray(resp.data)) {
          setHomeProducts(resp.data.slice(0, 8));
        } else {
          setHomeProducts([]);
        }
      } catch (e) {
        console.log("Error fetching products:", e);
        setHomeProducts([]);
      } finally {
        if (!isRefresh) {
          setHomeProductsLoading(false);
        }
      }
    },
    [effectiveStore?.id, isPharmacyStore],
  );

  useEffect(() => {
    fetchHomeProducts();
  }, [fetchHomeProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHomeProducts(true);
    setRefreshing(false);
  }, [fetchHomeProducts]);

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      if (isDrawerVisible) {
        setIsDrawerVisible(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [isDrawerVisible]);

  // Handlers
  const toggleDrawer = useCallback(() => {
    setIsDrawerVisible((prev) => !prev);
  }, []);

  const handleOverlayPress = useCallback(() => {
    setIsDrawerVisible(false);
  }, []);

  const handleSearchPress = useCallback(() => {
    navigation.navigate("SearchScreen", { autoFocus: true });
  }, [navigation]);

  const handleMicPress = useCallback(() => {
    navigation.navigate("SearchScreen", { autoFocus: false, voiceSearch: true });
  }, [navigation]);

  const handleCategoryPress = useCallback(
    (category: any) => {
      navigation.navigate("CategoryProducts" as any, {
        categoryId: category.id,
        categoryName: category.name,
      });
    },
    [navigation],
  );

  const handleViewAllCategories = useCallback(() => {
    navigation.navigate("CategoriesScreen" as any);
  }, [navigation]);

  // Themed styles
  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        contentContainer: {
          flex: 1,
        },
        section: {
          marginBottom: verticalScale(16),
          paddingHorizontal: scale(16),
        },
        sectionHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: verticalScale(12),
          paddingHorizontal: scale(16),
        },
        sectionTitle: {
          fontSize: moderateScale(18),
          fontWeight: "700",
          color: theme.colors.text,
        },
        viewAllButton: {
          flexDirection: "row",
          alignItems: "center",
        },
        viewAllText: {
          fontSize: moderateScale(14),
          fontWeight: "600",
          color: theme.colors.primary,
          marginRight: scale(4),
        },
        categoriesGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          paddingHorizontal: scale(16),
        },
        drawerOverlay: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          elevation: 1000,
        },
        noStoreContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: scale(20),
        },
        noStoreTitle: {
          color: theme.colors.text,
          fontSize: moderateScale(18),
          fontWeight: "bold",
          marginBottom: verticalScale(8),
          textAlign: "center",
        },
        noStoreSubtitle: {
          color: theme.colors.secondary,
          fontSize: moderateScale(14),
          textAlign: "center",
          marginBottom: verticalScale(20),
        },
        browseStoresButton: {
          backgroundColor: theme.colors.primary,
          paddingHorizontal: scale(24),
          paddingVertical: verticalScale(12),
          borderRadius: scale(8),
        },
        browseStoresText: {
          color: "#FFFFFF",
          fontSize: moderateScale(16),
          fontWeight: "600",
        },

        prescriptionCard: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: verticalScale(12),
          paddingHorizontal: scale(12),
          marginHorizontal: scale(16),
          borderRadius: scale(12),
          backgroundColor: "#E6ECFF",
          borderWidth: 1,
          borderColor: "#E3EAFF",
        },

        leftSection: {
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
        },

        title: {
          fontSize: moderateScale(16),
          fontWeight: "600",
          color: "#1E2A4A",
        },

        subtitle: {
          fontSize: moderateScale(12),
          color: "#6C7A99",
          marginTop: verticalScale(4),
          lineHeight: 18,
        },

        loadingContainer: {
          padding: scale(20),
          alignItems: "center",
        },
        loadingText: {
          color: theme.colors.secondary,
          fontSize: moderateScale(14),
        },
        emptyProductsText: {
          color: theme.colors.secondary,
          fontSize: moderateScale(14),
          textAlign: "center",
          padding: scale(20),
        },
        bannerContainer: {
          marginVertical: verticalScale(8),
        },
      }),
    [theme],
  );

  if (loading) {
    return (
      <View
        style={[
          themedStyles.noStoreContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={themedStyles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={themedStyles.container} edges={["top"]}>
        {/* Main Content - single ScrollView so header scrolls with content */}
        <View style={themedStyles.contentContainer}>
          {!effectiveStore ? (
            // No Store Selected View
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <Header
                onProfilePress={toggleDrawer}
                onSearchPress={handleSearchPress}
                onMicPress={handleMicPress}
                isDrawerVisible={isDrawerVisible}
                storeInfo={storeInfo}
                isPharmacyStore={isPharmacyStore}
              />
              <View style={themedStyles.noStoreContainer}>
                <MaterialIcons
                  name="store"
                  size={scale(64)}
                  color={theme.colors.secondary}
                  style={{ marginBottom: verticalScale(16) }}
                />
                <Text style={themedStyles.noStoreTitle}>No Store Selected</Text>
                <Text style={themedStyles.noStoreSubtitle}>
                  Please select a store to view products and categories
                </Text>
                <TouchableOpacity
                  style={themedStyles.browseStoresButton}
                  onPress={() =>
                    navigation.navigate("StoreList" as any, {
                      storeType: section,
                    })
                  }
                >
                  <Text style={themedStyles.browseStoresText}>
                    Browse Stores
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
                setScrollY(e.nativeEvent.contentOffset.y)
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#1E88E5"]}
                  tintColor="#1E88E5"
                />
              }
            >
              {/* Header - scrolls with page; when search bar hits top, sticky bar shows */}
              <Header
                onProfilePress={toggleDrawer}
                onSearchPress={handleSearchPress}
                onMicPress={handleMicPress}
                isDrawerVisible={isDrawerVisible}
                storeInfo={storeInfo}
                onHeaderAboveSearchLayout={setHeaderAboveSearchHeight}
                isPharmacyStore={isPharmacyStore}
              />
              {/* Horizontal Banner */}
              <View style={themedStyles.bannerContainer}>
                <BannerSlider />
              </View>

              {/* Order with Prescription Button - Only for Pharmacy */}
              {isPharmacyStore && (
                <TouchableOpacity
                  style={themedStyles.prescriptionCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (isAuthenticated && token) {
                      navigation.navigate("PaymentMethods" as any, {
                        isFromPrescription: true,
                      });
                    } else {
                      navigation.navigate("PhoneAuth" as any, {
                        cartType: "pharma",
                      });
                    }
                  }}
                >
                  <View style={themedStyles.leftSection}>
                    <Image
                      source={require("../../assets/homePageUploadRXIcon.png")}
                      style={{ width: scale(24), height: scale(24) }}
                    />

                    <View style={{ marginLeft: scale(12) }}>
                      <Text style={themedStyles.title}>
                        Upload Prescription
                      </Text>
                      <Text style={themedStyles.subtitle}>
                        Quick verification & Securely pharmacist verified
                      </Text>
                    </View>
                  </View>

                  <MaterialIcons
                    name="arrow-forward-ios"
                    size={scale(18)}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              )}

              {/* Medicine Categories Section */}
              <View style={{ marginVertical: verticalScale(16) }}>
                {/* Section Header with View All */}
                <View style={themedStyles.sectionHeader}>
                  <Text style={themedStyles.sectionTitle}>
                    {isPharmacyStore ? "Medicine Categories" : "Categories"}
                  </Text>
                  <TouchableOpacity
                    style={themedStyles.viewAllButton}
                    onPress={handleViewAllCategories}
                    activeOpacity={0.7}
                  >
                    <Text style={themedStyles.viewAllText}>View All</Text>
                    <MaterialIcons
                      name="chevron-right"
                      size={scale(20)}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Categories Grid - 8 Items (4x2) */}
                <View style={themedStyles.categoriesGrid}>
                  <CategoryGrid />
                </View>
              </View>

              {/* Some Products Section */}
              {/* <View>
                <View style={themedStyles.sectionHeader}>
                  <Text style={themedStyles.sectionTitle}>Some Products</Text>
                </View>

                {homeProductsLoading ? (
                  <View style={themedStyles.loadingContainer}>
                    <Text style={themedStyles.loadingText}>
                      Loading products...
                    </Text>
                  </View>
                ) : homeProducts.length > 0 ? (
                  <HorizontallyScrollableSection
                    title=""
                    itemsOverride={homeProducts.map((p) => ({
                      ...p,
                      category: isPharmacyStore ? "pharma" : "grocery",
                    }))}
                    hidePercentOff
                    hideWishlist
                    showFullName
                  />
                ) : (
                  <Text style={themedStyles.emptyProductsText}>
                    No products available for this store
                  </Text>
                )}
              </View> */}

              {/* Bottom Spacing */}
              <View style={{ height: verticalScale(20) }} />
            </ScrollView>
          )}

          {/* Sticky search bar - fixed at top when scrolled past header */}
          {showStickySearch && (
            <StickySearchBar
              onSearchPress={handleSearchPress}
              onMicPress={handleMicPress}
              isPharmacyStore={isPharmacyStore}
            />
          )}
        </View>

        {/* Drawer Overlay */}
        {isDrawerVisible && (
          <View style={themedStyles.drawerOverlay}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={handleOverlayPress}
              activeOpacity={1}
            />
            <Drawer onClose={toggleDrawer} />
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

// Static Styles
const styles = StyleSheet.create({
  // Header Styles
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
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(4),
  },
  headerIconButton: {
    padding: scale(8),
    position: "relative",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: scale(8),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
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
  // Store Info Row
  storeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
  },
  storeInfoItem: {
    backgroundColor: "#DEEFFA",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 50,
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
  },
  statusDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginRight: scale(6),
  },
  storeInfoText: {
    fontSize: moderateScale(12),
    color: "#666666",
    fontWeight: "500",
    marginLeft: scale(4),
  },
  infoDivider: {
    width: 1,
    height: verticalScale(12),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: scale(12),
  },
  // Sticky search bar (fixed at top when scrolled)
  stickySearchBarWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    elevation: 200,
  },
  stickySearchBarGradient: {
    paddingTop: Platform.OS === "android" ? 5 : 0,
    paddingBottom: verticalScale(12),
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  // Search Bar
  searchBarContainer: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(8),
  },
  searchBar: {
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
  searchPlaceholder: {
    flex: 1,
    fontSize: moderateScale(14),
    color: "#9E9E9E",
    marginLeft: scale(10),
  },
  searchMicButton: {
    padding: scale(4),
  },
  // Category Item
  categoryItem: {
    width: (SCREEN_WIDTH - scale(48)) / 4,
    alignItems: "center",
    marginBottom: verticalScale(16),
    paddingVertical: verticalScale(8),
  },
  categoryIconContainer: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(8),
  },
  categoryName: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    textAlign: "center",
    lineHeight: moderateScale(14),
  },
});

export default HomeScreen;
