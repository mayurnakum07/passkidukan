import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as Location from "expo-location";
import { Text } from "native-base";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StoreCard from "../../components/store/StoreCard";
import StoreTabs from "../../components/store/StoreTabs";
import { useAppContext } from "../../contexts/AppContext";
import { useCart } from "../../contexts/CartContext";
import { useTheme } from "../../contexts/ThemeContext";
import { RootStackParamList } from "../../navigation/types";
import storeService, {
  createAddressFromCoordinates,
  formatStoreAddress,
} from "../../services/api/storeService";

type NavigationProp = StackNavigationProp<RootStackParamList, "StoreList">;
type StoreListRouteProp = RouteProp<RootStackParamList, "StoreList">;

interface Store {
  id: string;
  name: string;
  type: "grocery" | "pharma";
  address: string;
  distance: string;
  rating: number;
  image?: string;
  pincode?: string;
  mobile?: string;
  totalItems?: number;
}

interface TabState {
  stores: Store[];
  loading: boolean;
  loaded: boolean;
  lastFetchKey: string;
  error: string | null; // Added error state
}

const StoreListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StoreListRouteProp>();
  const { theme, section, setSection } = useTheme();
  const { colors, typography, spacing, borderRadius } = theme;
  const { pincode, latitude, longitude, address } = route.params;
  const [activeTab, setActiveTab] = useState<"grocery" | "pharma">(
    route.params?.storeType ?? section,
  );
  const { setSelectedStore, saveLastVisitedStore, selectedStore } =
    useAppContext();
  const { clearCart, groceryItems, pharmacyItems } = useCart();

  // Track mounted state to prevent setState on unmounted component
  const isMountedRef = useRef(true);

  // Track current fetch to handle race conditions
  const fetchIdRef = useRef(0);

  // Per-tab state with loading, loaded, and error flags
  const [tabStates, setTabStates] = useState<{
    grocery: TabState;
    pharma: TabState;
  }>({
    grocery: {
      stores: [],
      loading: true,
      loaded: false,
      lastFetchKey: "",
      error: null,
    },
    pharma: {
      stores: [],
      loading: true,
      loaded: false,
      lastFetchKey: "",
      error: null,
    },
  });

  const [refreshing, setRefreshing] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Generate a key to track when location params change
  const getFetchKey = useCallback(() => {
    return `${latitude}-${longitude}-${pincode}`;
  }, [latitude, longitude, pincode]);

  // Keep StoreList tab in sync with navbar selection / route param
  useEffect(() => {
    const desiredTab: "grocery" | "pharma" = route.params?.storeType ?? section;
    if (desiredTab !== activeTab) {
      setActiveTab(desiredTab);
    }
  }, [route.params?.storeType, section]);

  const handleTabChange = useCallback(
    (tab: "grocery" | "pharma") => {
      if (tab === activeTab) return;

      const currentFetchKey = getFetchKey();
      const tabState = tabStates[tab];

      // If this tab hasn't been loaded or location changed, set loading immediately
      if (!tabState.loaded || tabState.lastFetchKey !== currentFetchKey) {
        setTabStates((prev) => ({
          ...prev,
          [tab]: { ...prev[tab], loading: true, error: null },
        }));
      }

      setActiveTab(tab);
      setSection(tab);
      navigation.setParams({ storeType: tab } as any);
    },
    [activeTab, tabStates, getFetchKey, setSection, navigation],
  );

  const handleStoreSelect = (store: Store) => {
    const storeWithType = {
      ...store,
      type: store.type || activeTab,
      pincode: store.pincode || pincode,
    };

    const hasCartItems =
      groceryItems.some((item) => item.quantity > 0) ||
      pharmacyItems.some((item) => item.quantity > 0);
    const isDifferentStore = selectedStore?.id !== storeWithType.id;

    if (isDifferentStore && hasCartItems) {
      Alert.alert(
        "Change Store",
        "If you change the store, your products added into cart will be deleted",
        [
          { text: "Cancel", onPress: () => {} },
          {
            text: "Proceed",
            onPress: async () => {
              await clearCart();
              proceedWithStoreSelection(storeWithType);
            },
            style: "destructive",
          },
        ],
      );
    } else {
      proceedWithStoreSelection(storeWithType);
    }
  };

  const proceedWithStoreSelection = (storeWithType: Store) => {
    setSelectedStore(storeWithType);
    saveLastVisitedStore(storeWithType);

    if (storeWithType.type === "pharma") {
      setSection("pharma");
    } else if (storeWithType.type === "grocery") {
      setSection("grocery");
    }

    navigation.navigate("Main", {
      screen: "Home",
      params: {
        screen: "HomeRoot",
        params: {
          storeId: storeWithType.id,
          pincode: pincode || address || storeWithType.pincode,
          storeType: storeWithType.type,
          storeName: storeWithType.name,
        },
      },
    });
  };

  const mapStore = useCallback(
    (raw: any, tab: "grocery" | "pharma"): Store => {
      const type = (raw.type || raw.storeType || tab) as "grocery" | "pharma";
      return {
        id: raw.storeId || raw.id || String(Math.random()),
        name: raw.name || raw.storeName || "Store",
        type,
        address: raw.address || raw.location?.address || "—",
        distance: raw.distance
          ? `${parseFloat(raw.distance).toFixed(1)} km away`
          : "",
        rating: raw.rating || 0,
        image: raw.image || raw.logo || undefined,
        pincode: raw.pincode || raw.address?.pincode || pincode,
        mobile: raw.mobile,
      } as Store;
    },
    [pincode],
  );

  const fetchStoreDetails = async (store: Store): Promise<Store> => {
    try {
      const response = await storeService.getStoreDetailsById(store.id);
      if (response.success && response.data) {
        const payload: any = response.data;
        const detailedStore = payload.data || payload;

        const coordinates = detailedStore.location?.coordinates as
          | [number, number]
          | undefined;
        const apiAddress =
          detailedStore.address || detailedStore.config?.address || null;

        let finalAddress = store.address;

        const hasAnyAddressField =
          !!apiAddress &&
          [
            apiAddress.address1,
            apiAddress.address2,
            apiAddress.city,
            apiAddress.state,
            apiAddress.pincode,
            apiAddress.country,
          ].some(
            (part: any) => typeof part === "string" && part.trim().length > 0,
          );

        if (hasAnyAddressField && coordinates) {
          finalAddress = formatStoreAddress(apiAddress, coordinates);
        } else if (coordinates && coordinates.length === 2) {
          try {
            const [lat, lng] = coordinates;
            const results = await Location.reverseGeocodeAsync({
              latitude: lat,
              longitude: lng,
            });

            if (results && results.length > 0) {
              const r = results[0];
              const parts = [
                r.name,
                r.street,
                r.city || r.subregion,
                r.region,
                r.postalCode,
                r.country,
              ].filter(Boolean);

              if (parts.length > 0) {
                finalAddress = parts.join(", ");
              } else {
                finalAddress = createAddressFromCoordinates(lat, lng);
              }
            } else {
              finalAddress = createAddressFromCoordinates(lat, lng);
            }
          } catch (geoError) {
            if (coordinates && coordinates.length === 2) {
              const [lat, lng] = coordinates;
              finalAddress = createAddressFromCoordinates(lat, lng);
            }
          }
        }

        const storePincode =
          apiAddress?.pincode ||
          detailedStore.pincode ||
          store.pincode ||
          pincode;

        return {
          ...store,
          address: finalAddress || "Store address not available",
          pincode: storePincode,
          mobile: String(detailedStore.mobile || store.mobile || ""),
        };
      }
    } catch (error) {
      // Silent fail for individual store details, return original
    }
    return store;
  };

  const fetchStores = useCallback(
    async (tab: "grocery" | "pharma", isRefresh = false) => {
      const currentFetchKey = getFetchKey();

      // Increment fetch ID to track this specific fetch
      const thisFetchId = ++fetchIdRef.current;

      // Set loading state for this specific tab
      if (!isRefresh) {
        setTabStates((prev) => ({
          ...prev,
          [tab]: { ...prev[tab], loading: true, error: null },
        }));
      }

      try {
        // Validate we have location data
        if (!latitude && !longitude && !pincode) {
          throw new Error(
            "No location data available. Please enable location or enter a pincode.",
          );
        }

        let response;
        if (latitude && longitude) {
          response = await storeService.exploreStoresByLocation(
            latitude,
            longitude,
            tab,
          );
        } else if (pincode) {
          response = await storeService.exploreStores(pincode, tab);
        } else {
          throw new Error("No location data available");
        }

        // Check if this fetch is still relevant (not stale)
        if (thisFetchId !== fetchIdRef.current) {
          console.log(`Fetch ${thisFetchId} is stale, ignoring results`);
          return;
        }

        // Check if component is still mounted
        if (!isMountedRef.current) {
          return;
        }

        // Validate response
        if (!response || !response.data) {
          throw new Error("Invalid response from server");
        }

        const raw: any = response.data;
        const list: any[] = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
            ? raw
            : [];

        const mapped: Store[] = list
          .map((r: any) =>
            mapStore({ ...r, type: r.type || r.storeType || tab }, tab),
          )
          .filter((s: Store) => s.type === tab);

        // Fetch details with timeout to prevent hanging
        const storesWithDetails = await Promise.all(
          mapped.map((store) =>
            Promise.race([
              fetchStoreDetails(store),
              new Promise<Store>(
                (resolve) => setTimeout(() => resolve(store), 5000), // 5s timeout per store
              ),
            ]),
          ),
        );

        // Final check before setting state
        if (thisFetchId !== fetchIdRef.current || !isMountedRef.current) {
          return;
        }

        setTabStates((prev) => ({
          ...prev,
          [tab]: {
            stores: storesWithDetails,
            loading: false,
            loaded: true,
            lastFetchKey: currentFetchKey,
            error: null,
          },
        }));
      } catch (error: any) {
        // Check if this fetch is still relevant
        if (thisFetchId !== fetchIdRef.current || !isMountedRef.current) {
          return;
        }

        const errorMessage =
          error?.message ||
          error?.response?.data?.message ||
          "Failed to load stores. Please try again.";

        console.error(`Error fetching ${tab} stores:`, error);

        setTabStates((prev) => ({
          ...prev,
          [tab]: {
            stores: [],
            loading: false,
            loaded: true,
            lastFetchKey: currentFetchKey,
            error: errorMessage,
          },
        }));
      }
    },
    [latitude, longitude, pincode, mapStore, getFetchKey],
  );

  // Load data when tab changes or location changes
  useEffect(() => {
    const currentFetchKey = getFetchKey();
    const tabState = tabStates[activeTab];

    // Only fetch if not loaded yet, or if location params changed
    if (!tabState.loaded || tabState.lastFetchKey !== currentFetchKey) {
      fetchStores(activeTab);
    }
  }, [activeTab, getFetchKey, fetchStores]); // Added proper dependencies

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStores(activeTab, true);
    if (isMountedRef.current) {
      setRefreshing(false);
    }
  };

  // Retry handler
  const handleRetry = useCallback(() => {
    // Reset the tab state and fetch again
    setTabStates((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        loading: true,
        error: null,
        loaded: false,
      },
    }));
    fetchStores(activeTab);
  }, [activeTab, fetchStores]);

  const currentTabState = tabStates[activeTab];
  const filteredStores = currentTabState.stores;
  const isLoading = currentTabState.loading;
  const error = currentTabState.error;

  const screenBg = "#F8F8FD";

  // Tab-wise loading icon animation (pulse/scale)
  const loadingScale = useRef(new Animated.Value(1)).current;
  const loadingOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!isLoading) {
      loadingScale.setValue(1);
      loadingOpacity.setValue(0.7);
      return;
    }

    loadingScale.setValue(1);
    loadingOpacity.setValue(0.7);

    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(loadingScale, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(loadingOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(loadingScale, {
            toValue: 0.95,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(loadingOpacity, {
            toValue: 0.7,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    anim.start();

    return () => {
      anim.stop();
    };
  }, [isLoading, activeTab, loadingScale, loadingOpacity]);

  const loadingIconColor =
    activeTab === "grocery"
      ? (colors.grocery?.primary ?? "#3FA34D")
      : (colors.pharma?.primary ?? "#5B7CFA");
  const loadingIconName =
    activeTab === "grocery" ? "basket-outline" : "medical-bag";
  const titleColor = "#333333";
  const subtitleColor = "#666666";

  // Skeleton placeholder component
  const StoreSkeleton = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImageContainer}>
        <Animated.View
          style={[styles.skeletonImage, { opacity: loadingOpacity }]}
        />
      </View>
      <View style={styles.skeletonContent}>
        <Animated.View
          style={[styles.skeletonTitle, { opacity: loadingOpacity }]}
        />
        <Animated.View
          style={[styles.skeletonAddress, { opacity: loadingOpacity }]}
        />
        <Animated.View
          style={[styles.skeletonDistance, { opacity: loadingOpacity }]}
        />
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: screenBg },
    content: { padding: spacing.md },
    header: { marginBottom: spacing.lg },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: titleColor,
      marginBottom: 4,
    },
    subtitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    subtitle: { fontSize: 14, color: subtitleColor },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
      minHeight: 300,
    },
    emptyStateTitle: {
      ...typography.h2,
      color: colors.text,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    emptyStateSubtitle: {
      ...typography.body1,
      color: subtitleColor,
      textAlign: "center",
      marginBottom: spacing.sm,
      lineHeight: 24,
    },
    loadingContainer: {
      flex: 1,
      paddingTop: spacing.xl,
    },
    loadingIconContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    loadingText: {
      fontSize: 16,
      color: subtitleColor,
      textAlign: "center",
      marginTop: spacing.md,
    },
    // Error state styles
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
      minHeight: 300,
    },
    errorTitle: {
      ...typography.h2,
      color: "#E53935",
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    errorMessage: {
      ...typography.body1,
      color: subtitleColor,
      textAlign: "center",
      marginBottom: spacing.lg,
      lineHeight: 22,
    },
    retryButton: {
      backgroundColor: loadingIconColor,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: borderRadius.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    retryButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    // Skeleton styles
    skeletonCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.md,
      padding: spacing.md,
      flexDirection: "row",
      ...Platform.select({
        ios: {
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: { elevation: 2 },
      }),
    },
    skeletonImageContainer: {
      marginRight: spacing.md,
    },
    skeletonImage: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.md,
      backgroundColor: "#E8E8F0",
    },
    skeletonContent: {
      flex: 1,
      justifyContent: "center",
    },
    skeletonTitle: {
      height: 18,
      width: "70%",
      backgroundColor: "#E8E8F0",
      borderRadius: 4,
      marginBottom: 10,
    },
    skeletonAddress: {
      height: 14,
      width: "90%",
      backgroundColor: "#E8E8F0",
      borderRadius: 4,
      marginBottom: 8,
    },
    skeletonDistance: {
      height: 12,
      width: "40%",
      backgroundColor: "#E8E8F0",
      borderRadius: 4,
    },
  });

  const renderContent = () => {
    // Show loading state
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <Animated.View
              style={{
                transform: [{ scale: loadingScale }],
                opacity: loadingOpacity,
              }}
            >
              <MaterialCommunityIcons
                name={loadingIconName as any}
                size={56}
                color={loadingIconColor}
              />
            </Animated.View>
            <Text style={styles.loadingText}>
              Finding {activeTab === "grocery" ? "grocery" : "pharmacy"} stores
              near you...
            </Text>
          </View>
          <StoreSkeleton />
          <StoreSkeleton />
          <StoreSkeleton />
        </View>
      );
    }

    // Show error state with retry button
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color="#E53935"
          />
          <Text style={styles.errorTitle}>Something Went Wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Show stores if available
    if (filteredStores.length > 0) {
      return filteredStores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          isGrocery={activeTab === "grocery"}
          onPress={() => handleStoreSelect(store)}
        />
      ));
    }

    // Show empty state (only if not refreshing)
    if (!refreshing) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="store-off"
            size={64}
            color={subtitleColor}
          />
          <Text style={styles.emptyStateTitle}>No Stores Found</Text>
          <Text style={styles.emptyStateSubtitle}>
            Sorry, we couldn't find any{" "}
            {activeTab === "grocery" ? "grocery" : "pharmacy"} stores in your
            area.
          </Text>
          <Text style={styles.emptyStateSubtitle}>
            Please try a different location or check back later.
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[loadingIconColor]}
            tintColor={loadingIconColor}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Stores Near You</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>
              {address ||
                (pincode ? `Pincode: ${pincode}` : "Sector 18, Noida")}
            </Text>
          </View>
        </View>

        <StoreTabs
          active={activeTab}
          onChange={handleTabChange}
          isGrocery={activeTab === "grocery"}
        />

        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StoreListScreen;