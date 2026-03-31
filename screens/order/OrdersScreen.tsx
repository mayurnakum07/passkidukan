import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { RootStackParamList } from "../../navigation/types";
import orderListService from "../../services/api/orderListService";
import orderService from "../../services/api/orderService";
import { storeService } from "../../services/api/storeService";

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: "pending" | "paid" | "completed" | "cancelled";
  paymentMethod: "online" | "offline";
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    type: "grocery" | "pharma";
    image?: string;
  }>;
  deliveryMethod: "store_pickup" | "home_delivery";
  address?: string;
  storeName?: string;
  storeType?: "pharma" | "grocery";
  storeId?: string;
  prescriptionRequired?: boolean;
  subtotalAmount?: number;
  storeDiscount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
}

// UI colors and layout matching the orders screen design
const ORDERS_UI = {
  screenBg: "#F5F4FF",
  cardBg: "#FFFFFF",
  textPrimary: "#000000",
  textSecondary: "#666666",
  textMuted: "#777777",
  tabActiveBg: "#5087E5",
  tabInactiveText: "#777777",
  borderLight: "#EEEEEE",
  green: "#4CAF50",
  greenLight: "#E8F5E9",
  blue: "#5087E5",
  grayPill: "#F0F0F0",
};

const OrdersScreen = () => {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start with true for initial load
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "Grocery" | "Pharmacy">(
    "ALL",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Initial load
    fetchOrdersForCurrentTab(1, false);
  }, []);

  // Refresh orders when screen comes into focus (e.g., after payment completion)
  useFocusEffect(
    useCallback(() => {
      // When screen refocuses, refresh first page for current tab
      fetchOrdersForCurrentTab(1, false);
    }, [activeTab]),
  );

  const checkPaymentStatus = async (orderNo: string) => {
    try {
      console.log("🔍 Checking payment status for order:", orderNo);
      const response = await orderService.getPaymentStatus(orderNo);

      if (response.success && response.data) {
        console.log(
          "✅ Payment status for",
          orderNo,
          ":",
          response.data.status,
        );
        return response.data.status;
      } else {
        console.log("⚠️ Could not get payment status for", orderNo);
        return "pending";
      }
    } catch (error) {
      console.error(
        "❌ Error checking payment status for",
        orderNo,
        ":",
        error,
      );
      return "pending";
    }
  };

  const fetchOrders = async (
    filterType: "pharma" | "grocery" | undefined,
    page: number,
    append: boolean,
  ) => {
    if (append) {
      // Loading more
      if (isLoadingMore || !hasMore) return;
      setIsLoadingMore(true);
    } else {
      // Fresh load / refresh
      setIsLoading(true);
      setHasMore(true);
      setCurrentPage(page);
    }
    try {
      const response = await orderListService.getOrders(filterType, page, 10);
      if (response.success && response.data) {
        // First, get all orders and check payment status for those with paymentId
        const ordersWithPaymentStatus = await Promise.all(
          (response.data || []).map(async (order: any) => {
            // Only check payment status for orders with paymentId (likely online payments)
            if (
              order.paymentId &&
              order.paymentId !== "22" &&
              order.paymentId !== "offline"
            ) {
              const actualPaymentStatus = await checkPaymentStatus(
                order.orderNo,
              );
              return { ...order, actualPaymentStatus };
            }
            return { ...order, actualPaymentStatus: "pending" };
          }),
        );

        // Transform API data to match UI format safely
        const transformedOrders = ordersWithPaymentStatus.map((order: any) => {
          const itemsArray = Array.isArray(order.orderItems)
            ? order.orderItems
            : Array.isArray(order.products)
              ? order.products
              : [];

          const orderType = order.type || "grocery";

          const mappedItems = itemsArray.map((item: any) => ({
            name: item.name || item.productName || "Item",
            quantity: Number(item.quantity) || 1,
            price: Number(item.actual ?? item.price ?? item.sp ?? 0),
            type: orderType as "grocery" | "pharma",
            image:
              item.signedImage ||
              item.image ||
              item.images?.primary ||
              (Array.isArray(item.images) ? item.images[0] : undefined) ||
              "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg",
          }));

          const paymentStatus = (
            order.actualPaymentStatus ||
            order.payment?.status ||
            ""
          ).toLowerCase();

          let paymentMethod: "online" | "offline";

          if (order.payment?.mode) {
            paymentMethod =
              order.payment.mode === "online" ? "online" : "offline";
          } else if (order.paymentData?.paymentMethod) {
            paymentMethod =
              order.paymentData.paymentMethod === "online"
                ? "online"
                : "offline";
          } else if (order.deliveryMethod === "store") {
            paymentMethod = "offline";
          } else if (
            order.paymentId === "22" ||
            order.paymentId === "offline" ||
            !order.paymentId
          ) {
            paymentMethod = "offline";
          } else {
            paymentMethod = "online";
          }

          let uiStatus: "pending" | "paid" | "completed" | "cancelled";

          if (
            paymentStatus === "success" ||
            paymentStatus === "completed" ||
            paymentStatus === "paid" ||
            paymentStatus === "verified"
          ) {
            uiStatus = "paid";
          } else if (
            paymentStatus === "cancelled" ||
            paymentStatus === "failed" ||
            paymentStatus === "rejected"
          ) {
            uiStatus = "cancelled";
          } else {
            if (
              order.paymentId &&
              order.paymentId !== "22" &&
              order.paymentId !== "offline"
            ) {
              uiStatus = "pending";
            } else {
              uiStatus = "pending";
            }
          }

          return {
            id: String(order.orderId || order._id || order.orderNo),
            orderNumber: order.orderNo || String(order.orderId || ""),
            date: order.createdAt || new Date().toISOString(),
            total: Number(order.totalAmount ?? 0),
            status: uiStatus,
            paymentMethod,
            items: mappedItems,
            deliveryMethod: (order.deliveryMethod === "store"
              ? "store_pickup"
              : "home_delivery") as "store_pickup" | "home_delivery",
            address: order.shippingAddress?.address || "Store Pickup",
            storeName: order.storeName || order.store?.name,
            storeId: order.storeId || order.store?.storeId,
            storeType: order.type || "grocery",
            prescriptionRequired: order.prescriptionRequired,
            subtotalAmount: Number(order.subtotalAmount ?? 0),
            storeDiscount: Number(order.storeDiscount ?? 0),
            shippingAmount: Number(order.shippingAmount ?? 0),
            taxAmount: Number(order.taxAmount ?? 0),
            totalAmount: Number(order.totalAmount ?? 0),
            originalOrderData: order,
          } as Order & { originalOrderData: any };
        });

        // Determine if there are more pages
        const pageSize = 10;
        if (transformedOrders.length < pageSize) {
          setHasMore(false);
        } else {
          setHasMore(true);
          setCurrentPage(page);
        }

        // Append or replace orders
        if (append) {
          setOrders((prev) => {
            const existingIds = new Set(prev.map((o) => o.id));
            const newOnes = transformedOrders.filter(
              (o) => !existingIds.has(o.id),
            );
            return [...prev, ...newOnes];
          });
        } else {
          // Replace orders - this ensures clean state for new tab
          setOrders(transformedOrders);
        }
      } else {
        // If no data returned, only clear orders if not appending
        if (!append) {
          setOrders([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.log("Error fetching orders:", error);
      if (!append) {
        setOrders([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrdersForCurrentTab(1, false);
    setRefreshing(false);
  };

  const getStatusDisplay = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return { text: "Payment Pending", variant: "warning" as const };
      case "paid":
        return { text: "Preparing Order", variant: "preparing" as const };
      case "completed":
        return { text: "Delivered", variant: "delivered" as const };
      case "cancelled":
        return { text: "Cancelled", variant: "cancelled" as const };
      default:
        return { text: String(status), variant: "delivered" as const };
    }
  };

  const getPaymentMethodText = (method: Order["paymentMethod"]) => {
    return method === "online" ? "Online Payment" : "Offline Payment";
  };

  const getDeliveryMethodText = (method: Order["deliveryMethod"]) => {
    return method === "store_pickup" ? "Store Pickup" : "Home Delivery";
  };

  const formatOrderDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(
        " ",
      );
      const month = months[d.getMonth()];
      const hrs = d.getHours();
      const mins = d.getMinutes();
      const ampm = hrs >= 12 ? "PM" : "AM";
      const h = hrs % 12 || 12;
      const m = mins < 10 ? "0" + mins : mins;
      return `${day} ${month} · ${h}:${m} ${ampm}`;
    } catch {
      return dateStr;
    }
  };

  const getFilterTypeForTab = (
    tabName: "ALL" | "Grocery" | "Pharmacy",
  ): "pharma" | "grocery" | undefined => {
    if (tabName === "Grocery") return "grocery";
    if (tabName === "Pharmacy") return "pharma";
    return undefined;
  };

  const fetchOrdersForCurrentTab = async (page: number, append: boolean) => {
    const filterType = getFilterTypeForTab(activeTab);
    await fetchOrders(filterType, page, append);
  };

  const handleTabChange = async (tabName: "ALL" | "Grocery" | "Pharmacy") => {
    if (activeTab === tabName) return; // Prevent unnecessary re-fetching

    setActiveTab(tabName);
    // Show loader immediately and reset pagination state
    setIsLoading(true);
    setCurrentPage(1);
    setHasMore(true);

    // Fetch new orders for the selected tab
    const filterType = getFilterTypeForTab(tabName);
    await fetchOrders(filterType, 1, false);
  };

  // No filtering needed - backend does the filtering
  const getFilteredOrders = () => {
    return orders;
  };

  const horizontalPadding = Math.max(16, Math.min(20, screenWidth * 0.05));
  const isSmallScreen = screenWidth < 375;

  const renderTabButton = (tabName: "ALL" | "Grocery" | "Pharmacy") => (
    <TouchableOpacity
      key={tabName}
      style={[
        styles.tabButton,
        {
          backgroundColor:
            activeTab === tabName ? ORDERS_UI.tabActiveBg : ORDERS_UI.cardBg,
          borderColor: ORDERS_UI.borderLight,
        },
      ]}
      onPress={() => handleTabChange(tabName)}
    >
      <Text
        style={[
          styles.tabButtonText,
          {
            color:
              activeTab === tabName ? "#FFFFFF" : ORDERS_UI.tabInactiveText,
            fontSize: isSmallScreen ? 13 : 14,
          },
        ]}
      >
        {tabName}
      </Text>
    </TouchableOpacity>
  );

  const handleOrderPress = (order: Order) => {
    navigation.navigate("OrderDetail", { order: order });
  };

  const handleReorderPress = (order: Order) => {
    navigation.navigate("OrderDetail", {
      order,
      scrollToBottom: true,
      highlightReorder: true,
    });
  };

  const handlePayNow = (order: Order) => {
    if (order.status === "pending" && order.paymentMethod === "online") {
      navigation.navigate("PaymentMethods" as any);
    }
  };

  const handleOpenStoreLocation = async (order: Order) => {
    try {
      if (!order.storeId) {
        return;
      }

      const res = await storeService.getStoreDetailsById(order.storeId);
      if (!res.success || !res.data) {
        return;
      }

      const rawStore: any = res.data;
      const storeData = rawStore.data || rawStore;
      const coordinates = storeData.location?.coordinates as
        | [number, number]
        | undefined;

      if (!coordinates || coordinates.length !== 2) {
        console.log("📍 Store coordinates not available");
        return;
      }

      const [latitude, longitude] = coordinates;
      const url =
        Platform.OS === "ios"
          ? `http://maps.apple.com/?ll=${latitude},${longitude}`
          : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

      await Linking.openURL(url);
    } catch (error) {
      console.log("❌ Error opening store location:", error);
    }
  };

  const DividerLine = () => {
    return (
      <View
        style={{
          height: 1,
          backgroundColor: ORDERS_UI.borderLight,
          marginVertical: 14,
        }}
      />
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: ORDERS_UI.screenBg }]}
      >
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: horizontalPadding,
              borderBottomColor: ORDERS_UI.borderLight,
              backgroundColor: ORDERS_UI.cardBg,
            },
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="chevron-back"
              size={26}
              color={ORDERS_UI.textPrimary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: ORDERS_UI.textPrimary }]}>
            Orders
          </Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.centerContent}>
          <Ionicons
            name="log-in-outline"
            size={64}
            color={theme.colors.secondary}
          />
          <Text style={[styles.loginText, { color: theme.colors.text }]}>
            Please login to view your orders
          </Text>
          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() =>
              navigation.navigate("PhoneAuth" as any, { cartType: "grocery" })
            }
          >
            <Text style={styles.loginButtonText}>Login / Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: ORDERS_UI.screenBg }]}
      edges={["top"]}
    >
      {/* Header: back + title */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: horizontalPadding,
            borderBottomColor: ORDERS_UI.borderLight,
            backgroundColor: ORDERS_UI.cardBg,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color={ORDERS_UI.textPrimary}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            {
              color: ORDERS_UI.textPrimary,
              fontSize: isSmallScreen ? 18 : 20,
            },
          ]}
        >
          Orders
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Tab bar: white container, blue active tab */}
      <View
        style={[
          styles.tabWrapper,
          {
            paddingHorizontal: horizontalPadding,
            backgroundColor: ORDERS_UI.cardBg,
            borderBottomColor: ORDERS_UI.borderLight,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContentContainer}
        >
          {renderTabButton("ALL")}
          {renderTabButton("Grocery")}
          {renderTabButton("Pharmacy")}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <Text
            style={[styles.loadingText, { color: ORDERS_UI.textSecondary }]}
          >
            Loading your orders...
          </Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons
            name="receipt-outline"
            size={64}
            color={ORDERS_UI.textMuted}
          />
          <Text style={[styles.emptyText, { color: ORDERS_UI.textPrimary }]}>
            No orders found
          </Text>
          <Text
            style={[styles.emptySubtext, { color: ORDERS_UI.textSecondary }]}
          >
            Your {activeTab === "ALL" ? "" : activeTab.toLowerCase()} orders
            will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (
              !isLoading &&
              !isLoadingMore &&
              hasMore &&
              filteredOrders.length > 0
            ) {
              fetchOrdersForCurrentTab(currentPage + 1, true);
            }
          }}
          contentContainerStyle={[
            styles.listContainer,
            { paddingHorizontal: horizontalPadding, paddingTop: 16 },
          ]}
          ListFooterComponent={
            isLoadingMore ? (
              <View
                style={{
                  paddingVertical: 16,
                  alignItems: "center",
                  paddingBottom: 40,
                }}
              >
                <Text
                  style={[
                    styles.loadingText,
                    { color: ORDERS_UI.textSecondary },
                  ]}
                >
                  Loading more orders...
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item: order }) => {
            const statusDisplay = getStatusDisplay(order.status);
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            const showPrescriptionVerified =
              order.storeType === "pharma" &&
              order.status !== "pending" &&
              order.status !== "cancelled";

            return (
              <View
                key={order.id}
                style={[
                  styles.orderCard,
                  {
                    backgroundColor: ORDERS_UI.cardBg,
                    borderRadius: 20,
                    paddingHorizontal: horizontalPadding,
                    paddingVertical: 18,
                    marginBottom: 20,
                    ...(Platform.OS === "ios"
                      ? {
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.08,
                          shadowRadius: 8,
                        }
                      : { elevation: 3 }),
                  },
                ]}
              >
                {/* Row 1: Order ID (left) + Status pill (right) */}
                <View style={styles.orderCardRow1}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.orderIdText,
                        {
                          color: ORDERS_UI.textPrimary,
                          fontSize: isSmallScreen ? 14 : 15,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      Order #{order.orderNumber}
                    </Text>
                    <Text
                      style={[
                        styles.orderDateText,
                        {
                          color: ORDERS_UI.textSecondary,
                          fontSize: isSmallScreen ? 12 : 13,
                          marginTop: 2,
                        },
                      ]}
                    >
                      {formatOrderDate(order.date)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          statusDisplay.variant === "preparing"
                            ? ORDERS_UI.green
                            : statusDisplay.variant === "delivered" ||
                                statusDisplay.variant === "cancelled"
                              ? ORDERS_UI.grayPill
                              : "#FFF3E0",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      },
                    ]}
                  >
                    {statusDisplay.variant === "preparing" && (
                      <MaterialIcons
                        name="inventory-2"
                        size={14}
                        color="#FFFFFF"
                      />
                    )}
                    {(statusDisplay.variant === "delivered" ||
                      statusDisplay.variant === "cancelled") && (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={ORDERS_UI.textSecondary}
                      />
                    )}
                    {statusDisplay.variant === "warning" && (
                      <Ionicons name="time-outline" size={14} color="#E65100" />
                    )}
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color:
                            statusDisplay.variant === "preparing"
                              ? "#FFFFFF"
                              : statusDisplay.variant === "warning"
                                ? "#E65100"
                                : ORDERS_UI.textSecondary,
                          fontSize: isSmallScreen ? 11 : 12,
                        },
                      ]}
                    >
                      {statusDisplay.text}
                    </Text>
                  </View>
                </View>

                <DividerLine />

                {/* Delivery method + optional store locate badge */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  {(() => {
                    const isStorePickup =
                      order.deliveryMethod === "store_pickup";
                    const pillBg = isStorePickup
                      ? ORDERS_UI.blue
                      : ORDERS_UI.green;
                    return (
                      <View
                        style={[
                          styles.deliveryMethodPill,
                          { backgroundColor: pillBg },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={isStorePickup ? "store" : "truck-delivery"}
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text
                          style={[
                            styles.deliveryLabel,
                            {
                              color: "#FFFFFF",
                              fontWeight: "600",
                              marginLeft: 6,
                            },
                          ]}
                        >
                          {isStorePickup ? "Store Pickup" : "Home Delivery"}
                        </Text>
                      </View>
                    );
                  })()}

                  {order.deliveryMethod === "store_pickup" && order.storeId && (
                    <TouchableOpacity
                      style={styles.locatePill}
                      activeOpacity={0.8}
                      onPress={() => handleOpenStoreLocation(order)}
                    >
                      <MaterialIcons
                        name="location-on"
                        size={16}
                        color={ORDERS_UI.blue}
                      />
                      <Text style={styles.locatePillText}>Locate</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Delivery: house icon + Home Delivery to + store name, then items · amount */}
                <View style={styles.deliveryRow}>
                  <Ionicons
                    name="home-outline"
                    size={20}
                    color={ORDERS_UI.textSecondary}
                    style={{ marginRight: 8, marginTop: 2, fontWeight: "600" }}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={[
                        styles.deliveryLabel,
                        {
                          color: ORDERS_UI.textSecondary,
                          fontSize: isSmallScreen ? 12 : 13,
                        },
                      ]}
                    >
                      {order.deliveryMethod === "home_delivery"
                        ? "Home Delivery to"
                        : "Store Pickup at"}
                    </Text>
                    <Text
                      style={[
                        styles.storeNameText,
                        {
                          color: ORDERS_UI.textPrimary,
                          fontSize: isSmallScreen ? 14 : 15,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {order.storeName ||
                        (order.items.some((i) => i.type === "pharma")
                          ? "Pharmacy Store"
                          : "Grocery Store")}
                    </Text>
                    <Text
                      style={[
                        styles.itemsSummary,
                        {
                          color: ORDERS_UI.textSecondary,
                          fontSize: isSmallScreen ? 12 : 13,
                        },
                      ]}
                    >
                      {itemCount} Items · ₹{Number(order.total).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Prescription Verified (pharmacy, non-pending) */}
                {/* {!showPrescriptionVerified && (
                  <View style={styles.prescriptionRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={ORDERS_UI.green}
                    />
                    <Text
                      style={[
                        styles.prescriptionText,
                        {
                          color: ORDERS_UI.green,
                          fontSize: isSmallScreen ? 12 : 13,
                        },
                      ]}
                    >
                      Prescription Verified
                    </Text>
                  </View>
                )} */}

                {/* Product thumbnails */}
                {order.items.length > 0 && (
                  <View style={styles.thumbnailsRow}>
                    {order.items.slice(0, 8).map((item, index) => (
                      <Image
                        key={index}
                        source={{
                          uri:
                            item.image ||
                            "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg",
                        }}
                        style={[
                          styles.thumbnailImage,
                          {
                            width: isSmallScreen ? 48 : 52,
                            height: isSmallScreen ? 48 : 52,
                            borderRadius: 10,
                            marginRight: index < order.items.length - 1 ? 8 : 0,
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}

                {/* Action buttons: View Details (blue text) + Reorder (outlined) */}
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => handleOrderPress(order)}>
                    <Text
                      style={[
                        styles.viewDetailsText,
                        {
                          color: ORDERS_UI.blue,
                          fontSize: isSmallScreen ? 14 : 15,
                        },
                      ]}
                    >
                      View Details
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleReorderPress(order)}>
                    <Text
                      style={[
                        styles.outlinedButtonText,
                        {
                          color: ORDERS_UI.blue,
                          fontSize: isSmallScreen ? 13 : 14,
                        },
                      ]}
                    >
                      Reorder
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: "700",
  },
  tabWrapper: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tabContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  tabButtonText: {
    fontWeight: "600",
  },
  listContainer: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loginText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  loginButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  orderCard: {},
  orderCardRow1: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  orderIdText: {
    fontWeight: "700",
  },
  orderDateText: {},
  statusPill: {},
  statusPillText: {
    fontWeight: "600",
  },
  deliveryMethodPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
  },
  locatePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: ORDERS_UI.blue,
    gap: 4,
  },
  locatePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: ORDERS_UI.blue,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  deliveryLabel: {},
  storeNameText: {
    fontWeight: "700",
  },
  itemsSummary: {},
  prescriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  prescriptionText: {
    fontWeight: "600",
  },
  thumbnailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  thumbnailImage: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: ORDERS_UI.borderLight,
  },
  actionRow: {
    borderWidth: 1,
    borderColor: ORDERS_UI.borderLight,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  viewDetailsText: {
    fontWeight: "600",
  },
  outlinedButton: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  outlinedButtonText: {
    fontWeight: "600",
  },
});

export default OrdersScreen;
