import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useCart } from "../../contexts/CartContext";
import { RootStackParamList } from "../../navigation/types";
import orderListService from "../../services/api/orderListService";
import storeService, {
  formatStoreAddress,
} from "../../services/api/storeService";
import { Divider } from "native-base";

type OrderConfirmationRouteProp = RouteProp<
  RootStackParamList,
  "OrderConfirmation"
>;

// UI design tokens (responsive, works on Android & iOS)
const UI = {
  screenBg: "#F8F7FA",
  cardBg: "#FFFFFF",
  successGreen: "#36C47A",
  successGreenBg: "#E3F6EE",
  primaryBlue: "#007BFF",
  textDark: "#343A40",
  textMuted: "#6C757D",
  cardRadius: 12,
  cardShadow: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),
  gradientBlue: ["#6A97E4", "#4D7DD6"] as const,
};

const OrderConfirmationScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<OrderConfirmationRouteProp>();
  const { clearCart } = useCart();
  const [buttonPressed, setButtonPressed] = useState<string | null>(null);
  const [storeDetails, setStoreDetails] = useState<any>(null);
  const [formattedStoreAddress, setFormattedStoreAddress] =
    useState<string>("");

  // Hardware back should always return to Home (Main tabs),
  // not back into checkout/payment screens.
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
        return true;
      };

      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => sub.remove();
    }, [navigation]),
  );

  // Get order details from route params or use defaults
  const routeParams: any = route.params || {};
  const {
    paymentData,
    orderId: routeOrderId,
    orderNo: routeOrderNo,
    amount: routeAmount,
    orderData: routeOrderData,
    prescriptionRequired: routePrescriptionRequired,
    storeId: routeStoreId,
    storeName: routeStoreName,
    fromPrescriptionFlow,
  } = routeParams;
  const routeStoreIdResolved = routeStoreId ?? (routeOrderData as any)?.storeId;
  const orderId = routeOrderId;
  const orderNo = routeOrderNo;
  const totalAmount = routeAmount || "";

  // Check prescriptionRequired from route params or orderData
  const prescriptionRequiredFromRoute =
    routePrescriptionRequired ||
    (routeOrderData as any)?.prescriptionRequired ||
    false;

  // State to track prescriptionRequired (can be updated from API)
  const [prescriptionRequired, setPrescriptionRequired] = useState<boolean>(
    prescriptionRequiredFromRoute,
  );

  // Use real order data if available, otherwise fallback to mock data
  const orderDetails = routeOrderData
    ? {
        orderId,
        orderNo,
        totalAmount: routeOrderData.grandTotal || totalAmount,
        items: routeOrderData.items || [],
        shippingAddress:
          routeOrderData.shippingAddress || "Address not available",
        deliveryMethod: routeOrderData.deliveryMethod || "Home Delivery",
        deliveryFee: routeOrderData.deliveryFee || 0,
        discount: routeOrderData.discount || 0,
        itemTotal: routeOrderData.itemTotal || 0,
        paymentData: paymentData,
      }
    : {
        // Fallback mock data
        orderId,
        totalAmount,
        items: [
          {
            id: "1",
            name: "Sample Product 1",
            price: 200,
            quantity: 2,
            image: "",
          },
          {
            id: "2",
            name: "Sample Product 2",
            price: 150,
            quantity: 1,
            image: "",
          },
        ],
        shippingAddress: "123 Main St, City, State - 12345",
        deliveryMethod: "Home Delivery",
        deliveryFee: 50,
        discount: 20,
        itemTotal: 400,
        paymentData: paymentData,
      };

  // Update prescriptionRequired when route params change
  useEffect(() => {
    setPrescriptionRequired(prescriptionRequiredFromRoute);
  }, [prescriptionRequiredFromRoute]);

  // Fetch order details from API to check prescriptionRequired
  useEffect(() => {
    const fetchOrderDetails = async () => {
      // Always try to fetch from API if orderId exists and doesn't look like a mock ID
      if (orderId && !orderId.startsWith("ORD")) {
        try {
          const response = await orderListService.getOrderById(orderId);
          if (response.success && response.data) {
            const orderData = response.data;
            // Check prescriptionRequired field from API response
            const prescriptionRequiredValue =
              orderData.prescriptionRequired === true;

            setPrescriptionRequired(prescriptionRequiredValue);
          } else {
            // If API fetch fails, use the value from route/orderData
            setPrescriptionRequired(prescriptionRequiredFromRoute);
          }
        } catch (error) {
          console.error("❌ Error fetching order details:", error);
          // If API fetch fails, use the value from route/orderData
          setPrescriptionRequired(prescriptionRequiredFromRoute);
        }
      } else {
        // For mock orders or when orderId starts with "ORD", use prescriptionRequired from route/orderData
        setPrescriptionRequired(prescriptionRequiredFromRoute);
      }
    };

    fetchOrderDetails();
  }, [orderId, prescriptionRequiredFromRoute]);

  // Fetch store details for store name (header) and address (Store Pickup)
  useEffect(() => {
    const fetchStoreDetails = async () => {
      const storeId = routeStoreIdResolved;
      if (storeId && !storeDetails) {
        try {
          const response = await storeService.getStoreDetailsById(storeId);
          if (response.success && response.data) {
            const storeData = (response.data as any).data || response.data;
            setStoreDetails(storeData);

            if (orderDetails.deliveryMethod === "Store Pickup") {
              const coordinates = storeData.location?.coordinates;
              if (storeData.address || coordinates) {
                const formattedAddress = formatStoreAddress(
                  storeData.address || {},
                  coordinates,
                );
                setFormattedStoreAddress(formattedAddress);
              }
            }
          }
        } catch (error) {
          console.error(
            "❌ Error fetching store details for confirmation:",
            error,
          );
        }
      }
    };

    fetchStoreDetails();
  }, [routeStoreIdResolved, storeDetails, orderDetails.deliveryMethod]);

  useEffect(() => {
    const clearCartAsync = async () => {
      await clearCart();
    };
    clearCartAsync();
  }, []);

  // Reset button state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset button pressed state when screen is focused
      setButtonPressed(null);
    }, []),
  );

  const handleContinueShopping = () => {
    setButtonPressed("continue");

    // Add a small delay for visual feedback
    setTimeout(() => {
      try {
        // Navigate to the main home screen
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "Main",
              params: {
                screen: "Home",
                params: {
                  screen: "HomeRoot",
                },
              },
            },
          ],
        });
        // Reset button state after navigation
        setTimeout(() => setButtonPressed(null), 300);
      } catch (error) {
        console.error("Error navigating to Main:", error);
        // Fallback navigation
        navigation.navigate("Main" as any);
        setButtonPressed(null);
      }
    }, 200);
  };

  const handleViewOrderDetails = () => {
    setButtonPressed("details");

    // Add a small delay for visual feedback
    setTimeout(() => {
      try {
        const orderData = {
          id: orderId,
          ...orderDetails,
          orderNo: orderNo,
          status: "confirmed",
          orderDate: new Date().toISOString(),
          paymentStatus: paymentData ? "paid" : "pending",
        };
        navigation.navigate("OrderDetail", { order: orderData });
        // Reset button state after navigation
        setTimeout(() => setButtonPressed(null), 300);
      } catch (error) {
        console.error("Error navigating to OrderDetail:", error);
        Alert.alert("Error", "Unable to view order details. Please try again.");
        setButtonPressed(null);
      }
    }, 200);
  };

  const handleClose = () => {
    try {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "Main",
            params: {
              screen: "Home",
              params: { screen: "HomeRoot" },
            },
          },
        ],
      });
    } catch (error) {
      console.error("Error closing:", error);
      navigation.navigate("Main" as any);
    }
  };

  const storeDisplayName =
    routeStoreName ||
    (routeOrderData as any)?.storeName ||
    storeDetails?.name ||
    "Our Store";
  const isStorePickup = orderDetails.deliveryMethod === "Store Pickup";
  const deliveryByDate = new Date(
    Date.now() + (isStorePickup ? 25 : 45) * 60 * 1000,
  );
  const deliveryDateStr = deliveryByDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const estimatedArrival = isStorePickup ? "20-25 mins" : "30-40 mins";
  const storeCoordinates = storeDetails?.location?.coordinates as
    | [number, number]
    | undefined;
  const hasStoreCoords =
    isStorePickup && storeCoordinates && storeCoordinates.length === 2;
  const deliveryAddress =
    isStorePickup && formattedStoreAddress
      ? formattedStoreAddress
      : typeof orderDetails.shippingAddress === "string"
        ? orderDetails.shippingAddress
        : "Address not available";
  const isCoordDisplay =
    hasStoreCoords &&
    (formattedStoreAddress?.startsWith("Store Location (") ?? false);
  const openStoreMap = () => {
    if (hasStoreCoords) {
      const [lat, lng] = storeCoordinates!;
      Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`).catch(() =>
        Alert.alert("", "Unable to open maps."),
      );
    }
  };
  const itemCount = orderDetails.items?.length ?? 0;
  const isPrescriptionFlow = !!fromPrescriptionFlow;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: UI.screenBg,
    },
    header: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    closeButton: { padding: 8 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 24 + insets.bottom,
    },
    successIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: UI.successGreenBg,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: UI.successGreen,
      textAlign: "center",
      marginBottom: 6,
    },
    thankYouText: {
      fontSize: 15,
      color: UI.textMuted,
      textAlign: "center",
      marginBottom: 4,
    },
    storeNameText: {
      fontSize: 17,
      fontWeight: "600",
      color: UI.textDark,
      textAlign: "center",
      marginBottom: 28,
    },
    card: {
      backgroundColor: UI.cardBg,
      borderRadius: UI.cardRadius,
      padding: 18,
      marginBottom: 20,
      ...UI.cardShadow,
    },
    cardRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    cardRowLast: { marginBottom: 0 },
    cardIcon: { marginRight: 12, marginTop: 2 },
    cardTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: UI.textDark,
      flex: 1,
    },
    cardSubtext: {
      fontSize: 13,
      color: UI.textMuted,
      marginTop: 4,
      paddingLeft: 36,
    },
    cardLabel: {
      fontSize: 15,
      color: UI.textDark,
      marginBottom: 2,
    },
    cardValue: {
      fontSize: 13,
      color: UI.textDark,
    },
    orderSummaryId: {
      fontSize: 17,
      fontWeight: "600",
      color: UI.textDark,
      marginBottom: 6,
    },
    orderSummaryMeta: {
      fontSize: 15,
      color: UI.textMuted,
      marginBottom: 8,
    },
    totalPaidRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    viewBillLink: {
      fontSize: 14,
      color: UI.primaryBlue,
      fontWeight: "500",
    },
    trackOrderButton: {
      marginTop: 28,
      borderRadius: 10,
      overflow: "hidden",
      minHeight: 52,
      justifyContent: "center",
      alignItems: "center",
    },
    trackOrderButtonText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "600",
    },
    continueShoppingLink: {
      marginTop: 18,
      alignSelf: "center",
    },
    continueShoppingText: {
      fontSize: 16,
      color: UI.primaryBlue,
      fontWeight: "500",
    },
    prescriptionHeaderTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: UI.successGreen,
      textAlign: "center",
      marginBottom: 6,
    },
    prescriptionHeaderSubtitle: {
      fontSize: 15,
      color: UI.textMuted,
      textAlign: "center",
      marginBottom: 20,
    },
    prescriptionHeaderStore: {
      fontSize: 15,
      color: UI.textDark,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 2,
    },
    reviewCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    reviewCardTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: UI.textDark,
      marginLeft: 10,
    },
    reviewCardSubtitle: {
      fontSize: 12,
      fontWeight: "400",
      color: UI.textDark,
      marginLeft: 10,
      marginTop: 4,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginTop: 10,
    },
    statusTextPrimary: {
      fontSize: 13,
      color: UI.textDark,
      fontWeight: "500",
      marginLeft: 8,
    },
    statusTextSecondary: {
      fontSize: 13,
      color: UI.textMuted,
      marginLeft: 8,
    },
    deliveryInfoBox: {
      marginTop: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#E0E3EB",
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: "#F9FAFF",
    },
    deliveryInfoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    deliveryInfoIcon: {
      marginTop: 2,
      marginRight: 8,
    },
    deliveryInfoTitle: {
      fontSize: 14,
      color: UI.textDark,
      fontWeight: "500",
    },
    deliveryInfoSubtitle: {
      fontSize: 12,
      color: UI.textMuted,
      marginTop: 2,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={UI.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isPrescriptionFlow ? (
          <>
            {/* Header: Prescription Received */}
            <View style={{ alignItems: "center" }}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={36} color={UI.successGreen} />
              </View>
              <Text style={styles.prescriptionHeaderTitle}>
                Prescription Received!
              </Text>
              <Text style={styles.prescriptionHeaderSubtitle}>
                Thank you, your prescription has been successfully submitted to{" "}
                <Text style={styles.prescriptionHeaderStore}>
                  {storeDisplayName}
                </Text>
              </Text>
            </View>

            {/* Card: Pharmacist Reviewing Prescription */}
            <View style={styles.card}>
              <View style={styles.reviewCardHeader}>
                <Image
                  source={require("../../assets/orderConfirmPageVector.png")}
                  style={{ width: 60, height: 60, borderRadius: 20 }}
                />
                <View>
                  <Text style={styles.reviewCardTitle}>
                    Pharmacist Reviewing Prescription
                  </Text>
                  <Text style={styles.reviewCardSubtitle}>
                    Our pharmacist is reviewing your prescription {"\n"}and will
                    contact you shortly.
                  </Text>
                </View>
              </View>

              {/* Blue status row with check icon */}
              <View
                style={[
                  styles.statusRow,
                  { backgroundColor: "#F9FAFF", marginTop: 12 },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={UI.successGreen}
                />
                <Text
                  style={[
                    styles.statusTextPrimary,
                    { color: UI.textDark, fontSize: 10, fontWeight: "600" },
                  ]}
                >
                  You'll receive a confirmation of medicines & prices soon
                </Text>
              </View>

              {/* Orange text without background */}
              <View
                style={[
                  styles.statusRow,
                  { backgroundColor: "transparent", paddingHorizontal: 0 },
                ]}
              >
                <Ionicons name="ellipse" size={8} color="#F9A825" />
                <Text
                  style={[
                    styles.statusTextSecondary,
                    { color: "#F9A825", marginLeft: 6 },
                  ]}
                >
                  Waiting for Pharmacist Review
                </Text>
              </View>
            </View>

            {/* Card: Order ID */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color={UI.primaryBlue}
                  />
                </View>
                <Text style={styles.cardLabel}>Order ID</Text>
                <Text
                  style={[
                    styles.cardValue,
                    {
                      marginLeft: 12,
                      fontWeight: "700",
                      color: UI.textDark,
                    },
                  ]}
                >
                  #{orderNo || orderId || "—"}
                </Text>
              </View>
            </View>

            {/* Card: Delivery Details / Store Pickup */}
            <View style={styles.card}>
              {/* Header with delivery/store icon and title */}
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons
                    name={
                      isStorePickup
                        ? "storefront-outline"
                        : "truck-delivery-outline"
                    }
                    size={24}
                    color={UI.primaryBlue}
                  />
                </View>
                <Text style={styles.cardTitle}>
                  {isStorePickup ? "Store Pickup" : "Delivery Details"}
                </Text>
              </View>

              {/* Inner info box */}
              <View style={styles.deliveryInfoBox}>
                {/* Estimated delivery / ready time */}
                {/* <View style={styles.deliveryInfoRow}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={18}
                    color="#1E88E5"
                    style={styles.deliveryInfoIcon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deliveryInfoTitle}>
                      {isStorePickup
                        ? "Ready in 20–30 mins"
                        : "Estimated Delivery"}
                    </Text>
                    <Text style={styles.deliveryInfoSubtitle}>
                      {isStorePickup
                        ? "after confirmation"
                        : "30–50 mins after confirmation"}
                    </Text>
                  </View>
                </View>

                <Divider style={{ marginVertical: 4, height: 1 }} /> */}

                {/* Delivering to / Pickup at */}
                <View style={[styles.deliveryInfoRow, { marginBottom: 0 }]}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color="#5F6368"
                    style={styles.deliveryInfoIcon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deliveryInfoTitle}>
                      {isStorePickup ? "Pickup at:" : "Delivering to:"}
                    </Text>
                    {isStorePickup && (
                      <Text style={[styles.cardValue, { marginTop: 2 }]}>
                        {storeDisplayName}
                      </Text>
                    )}
                    {isCoordDisplay ? (
                      <TouchableOpacity
                        onPress={openStoreMap}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 6,
                        }}
                      >
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={28}
                          color="#E53935"
                        />
                        <Text style={[styles.cardLabel, { marginLeft: 8 }]}>
                          Open in Maps
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text
                        style={styles.cardLabel}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {deliveryAddress}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Track Order button */}
            <TouchableOpacity
              onPress={handleViewOrderDetails}
              disabled={buttonPressed !== null}
              style={buttonPressed === "details" ? { opacity: 0.6 } : undefined}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={UI.gradientBlue}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.trackOrderButton}
              >
                <Text style={styles.trackOrderButtonText}>
                  {buttonPressed === "details" ? "Loading..." : "Track Order"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Continue Shopping link */}
            <TouchableOpacity
              style={styles.continueShoppingLink}
              onPress={handleContinueShopping}
              disabled={buttonPressed !== null}
            >
              <Text style={styles.continueShoppingText}>
                {buttonPressed === "continue"
                  ? "Loading..."
                  : "Continue Shopping"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Success section */}
            <View style={{ alignItems: "center" }}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={36} color={UI.successGreen} />
              </View>
              <Text style={styles.successTitle}>Order Placed Successfully</Text>
              <Text style={styles.thankYouText}>
                Thank you for ordering from
              </Text>
              <Text style={styles.storeNameText}>{storeDisplayName}</Text>
            </View>

            {/* Card 1: Delivery Details */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={24}
                    color={UI.primaryBlue}
                  />
                </View>
                <Text style={styles.cardTitle}>
                  {isStorePickup ? "Pickup by" : "Delivery by"}{" "}
                  {deliveryDateStr}
                </Text>
              </View>
              {/* <Text style={styles.cardSubtext}>
                Estimated arrival: {estimatedArrival}
              </Text> */}
              <View style={[styles.cardRow, { marginTop: 18 }]}>
                <View style={styles.cardIcon}>
                  <Ionicons name="location" size={24} color={UI.primaryBlue} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.cardTitle}>
                    {isStorePickup ? "Pickup at:" : "Delivering to:"}
                  </Text>
                  {isCoordDisplay ? (
                    <TouchableOpacity
                      onPress={openStoreMap}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 6,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={28}
                        color="#E53935"
                      />
                      <Text style={[styles.cardLabel, { marginLeft: 8 }]}>
                        Open in Maps
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text
                      style={styles.cardLabel}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {deliveryAddress}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Card 2: Prescription Received (only when prescription was required) */}
            {prescriptionRequired && (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardIcon}>
                    <Ionicons
                      name="document-text"
                      size={24}
                      color={UI.primaryBlue}
                    />
                  </View>
                  <Text style={styles.cardTitle}>Prescription Received</Text>
                </View>
                <Text style={styles.cardSubtext}>
                  Your prescription has been submitted.
                </Text>
                <Text style={styles.cardSubtext}>
                  Our certified pharmacist will verify it shortly.
                </Text>
              </View>
            )}

            {/* Card 3: Order Summary */}
            <View style={styles.card}>
              <Text style={styles.orderSummaryId}>
                Order ID #{orderNo || orderId || "—"}
              </Text>
              <Text style={styles.orderSummaryMeta}>
                {itemCount} Item{itemCount !== 1 ? "s" : ""}
              </Text>
              <View style={styles.totalPaidRow}>
                <Text style={[styles.cardLabel, { marginBottom: 0 }]}>
                  Total Paid
                </Text>
                <Text style={styles.cardValue}>
                  ₹{orderDetails.totalAmount.toFixed(2)}
                </Text>
              </View>
              <Divider style={{ marginVertical: 12, height: 1 }} />
              <TouchableOpacity
                onPress={handleViewOrderDetails}
                disabled={buttonPressed !== null}
                style={{ alignSelf: "flex-end" }}
              >
                <Text style={styles.viewBillLink}>View Bill Details &gt;</Text>
              </TouchableOpacity>
            </View>

            {/* Track Order button */}
            <TouchableOpacity
              onPress={handleViewOrderDetails}
              disabled={buttonPressed !== null}
              style={buttonPressed === "details" ? { opacity: 0.6 } : undefined}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={UI.gradientBlue}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.trackOrderButton}
              >
                <Text style={styles.trackOrderButtonText}>
                  {buttonPressed === "details" ? "Loading..." : "Track Order"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Continue Shopping link */}
            <TouchableOpacity
              style={styles.continueShoppingLink}
              onPress={handleContinueShopping}
              disabled={buttonPressed !== null}
            >
              <Text style={styles.continueShoppingText}>
                {buttonPressed === "continue"
                  ? "Loading..."
                  : "Continue Shopping"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderConfirmationScreen;
