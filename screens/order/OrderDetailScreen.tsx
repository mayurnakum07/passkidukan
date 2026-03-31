import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../../contexts/CartContext";
import { useTheme } from "../../contexts/ThemeContext";
import { RootStackParamList } from "../../navigation/types";
import { storeProductService } from "../../services/api/storeProductService";
import storeService, {
  createAddressFromCoordinates,
  formatStoreAddress,
} from "../../services/api/storeService";

type OrderDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "OrderDetail"
>;

const OrderDetailScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<OrderDetailScreenNavigationProp>();
  const route = useRoute();
  const { addToGroceryCart, addToPharmacyCart, groceryItems, pharmacyItems } =
    useCart();
  const params = route.params as any;
  const passedOrder = params?.order;
  const passedOrderId = params?.orderId as string | undefined;
  const scrollToBottom = params?.scrollToBottom === true;
  const highlightReorder = params?.highlightReorder === true;

  const scrollViewRef = useRef<any>(null);
  const reorderPulse = useRef(new Animated.Value(0)).current;
  const [isReorderHighlighted, setIsReorderHighlighted] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiOrder, setApiOrder] = useState<any>(null);
  console.log("apiOrder", apiOrder);
  const [storeDetails, setStoreDetails] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [formattedStoreAddress, setFormattedStoreAddress] =
    useState<string>("");

  // Import orderListService to fetch order details
  const orderListService =
    require("../../services/api/orderListService").default;

  const { width: screenWidth } = useWindowDimensions();

  // Use API data if available, otherwise fallback to passed order
  const order = apiOrder || passedOrder;

  // Format order date for header: "12 Feb • 5:02 PM"
  const orderDateFormatted = (() => {
    const raw =
      order?.createdAt || order?.date || order?.orderDate || new Date();
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    const day = d.getDate();
    const month = d.toLocaleString("en-IN", { month: "short" });
    const time = d.toLocaleString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${day} ${month} • ${time}`;
  })();

  // Light blue gradient for cards
  const cardGradient = ["#DEE5FF", "#FFFFFF"] as const;

  // Arriving by time (from API or fallback)
  const arrivingByFormatted =
    order?.estimatedDelivery ||
    order?.deliveryDate ||
    (order?.createdAt
      ? (() => {
          const d = new Date(order.createdAt);
          d.setHours(d.getHours() + 2);
          return d.toLocaleString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        })()
      : null);

  // Extract prescription URL - use signedPresciptionUrl only
  const prescriptionUrls = {
    signedPresciptionUrl:
      apiOrder?.signedPresciptionUrl ||
      order?.signedPresciptionUrl ||
      order?.originalOrderData?.signedPresciptionUrl,
  };

  const fetchOrderDetails = async () => {
    const orderIdToFetch =
      passedOrderId || passedOrder?.orderId || passedOrder?.id;

    if (!orderIdToFetch) return;

    try {
      setLoading(true);
      const res = await orderListService.getOrderById(orderIdToFetch);

      if (res.success && res.data) {
        setApiOrder(res.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Final prescription URL (only from signedPresciptionUrl)
  const finalPrescriptionUrl = prescriptionUrls.signedPresciptionUrl;

  // Determine if this is a pharma order (only then show prescription section)
  const storeType = (
    apiOrder?.type ||
    apiOrder?.store?.type ||
    (order as any)?.originalOrderData?.type ||
    order?.type ||
    order?.store?.type ||
    ""
  )
    .toString()
    .toLowerCase();
  const isPharmaOrder = storeType === "pharma";

  // Fetch order details from API when screen loads
  useEffect(() => {
    const fetchOrderData = async () => {
      // Always fetch fresh data if we have orderId
      const orderIdToFetch =
        passedOrderId || passedOrder?.orderId || passedOrder?.id;

      if (orderIdToFetch) {
        try {
          setLoading(true);
          const res = await orderListService.getOrderById(orderIdToFetch);

          if (res.success && res.data) {
            setApiOrder(res.data);
          } else {
          }
        } catch (error) {
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [passedOrderId, passedOrder?.orderId, passedOrder?.id]);

  // If user tapped "Re-order" from Orders list, scroll to bottom + highlight Reorder CTA
  useEffect(() => {
    if (!scrollToBottom && !highlightReorder) return;
    if (loading) return;

    if (scrollToBottom) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd?.({ animated: true });
        }, 200);
      });
    }

    if (highlightReorder) {
      setIsReorderHighlighted(true);
      reorderPulse.setValue(0);
      Animated.sequence([
        Animated.timing(reorderPulse, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(reorderPulse, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(reorderPulse, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(reorderPulse, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsReorderHighlighted(false);
      });
    }

    navigation.setParams({
      scrollToBottom: undefined,
      highlightReorder: undefined,
    } as any);
  }, [scrollToBottom, highlightReorder, loading, navigation, reorderPulse]);

  // Fetch store details for store address display
  useEffect(() => {
    const fetchStoreDetails = async () => {
      const currentOrder = apiOrder || passedOrder;
      if (currentOrder?.storeId && !storeDetails) {
        try {
          const response = await storeService.getStoreDetailsById(
            currentOrder.storeId,
          );
          if (response.success && response.data) {
            const storeData = (response.data as any).data || response.data;
            setStoreDetails(storeData);

            // Format address using API fields + reverse geocoding if needed
            const coordinates = storeData.location?.coordinates as
              | [number, number]
              | undefined;
            const apiAddress =
              storeData.address || storeData.config?.address || null;

            let finalAddress: string | undefined;

            // Check if API has any non-empty address fields
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
                (part: any) =>
                  typeof part === "string" && part.trim().length > 0,
              );

            // 1) Prefer nicely formatted API address if present
            if (hasAnyAddressField) {
              finalAddress = formatStoreAddress(apiAddress, coordinates);
            }
            // 2) If API address empty but coordinates present → reverse geocode
            else if (coordinates && coordinates.length === 2) {
              try {
                const [latitude, longitude] = coordinates;
                const results = await Location.reverseGeocodeAsync({
                  latitude,
                  longitude,
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
                    finalAddress = createAddressFromCoordinates(
                      latitude,
                      longitude,
                    );
                  }
                } else {
                  finalAddress = createAddressFromCoordinates(
                    latitude,
                    longitude,
                  );
                }
              } catch (geoErr) {
                if (coordinates && coordinates.length === 2) {
                  const [lat, lng] = coordinates;
                  finalAddress = createAddressFromCoordinates(lat, lng);
                }
              }
            }

            if (finalAddress) {
              setFormattedStoreAddress(finalAddress);
            }
          }
        } catch (error) {}
      }
    };

    fetchStoreDetails();
  }, [apiOrder, passedOrder, storeDetails]);

  useEffect(() => {
    fetchOrderDetails();
  }, [passedOrderId, passedOrder?.orderId, passedOrder?.id]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      const orderIdToFetch =
        passedOrderId || passedOrder?.orderId || passedOrder?.id;

      if (!orderIdToFetch) return;

      // Re-fetch order
      const res = await orderListService.getOrderById(orderIdToFetch);
      if (res.success && res.data) {
        setApiOrder(res.data);
      }

      // Re-fetch store details if available
      const storeId =
        res?.data?.storeId || passedOrder?.storeId || storeDetails?.id;

      if (storeId) {
        const storeRes = await storeService.getStoreDetailsById(storeId);
        if (storeRes.success && storeRes.data) {
          const storeData = (storeRes.data as any).data || storeRes.data;
          setStoreDetails(storeData);
        }
      }
    } catch (err) {
    } finally {
      setRefreshing(false);
    }
  };

  // Add default values to prevent undefined errors
  // Normalize payment status/mode for consistent UI
  const backendPayment = order?.payment || (order as any)?.paymentData || null;
  const backendPaymentStatus = (
    backendPayment?.status ||
    order?.paymentStatus ||
    order?.status ||
    ""
  )
    .toString()
    .toLowerCase();
  const paymentIdPresent = !!(order?.paymentId || backendPayment?.paymentId);
  let normalizedPaymentStatus:
    | "paid"
    | "pending"
    | "cancelled"
    | "failed"
    | "unknown" = "unknown";
  if (["completed", "success", "paid"].includes(backendPaymentStatus))
    normalizedPaymentStatus = "paid";
  else if (
    ["pending", "processing", "initiated"].includes(backendPaymentStatus)
  )
    normalizedPaymentStatus = "pending";
  else if (["cancelled", "canceled"].includes(backendPaymentStatus))
    normalizedPaymentStatus = "cancelled";
  else if (["failed", "failure", "error"].includes(backendPaymentStatus))
    normalizedPaymentStatus = "failed";
  if (normalizedPaymentStatus === "unknown" && paymentIdPresent)
    normalizedPaymentStatus = "pending";

  const normalizedPaymentMode: "online" | "offline" | "unknown" =
    backendPayment?.mode === "online" || order?.paymentMethod === "online"
      ? "online"
      : backendPayment?.mode === "offline"
        ? "offline"
        : "unknown";

  const formatAddressString = (address: any): string => {
    if (!address) return "Store Pickup";

    if (typeof address === "string") {
      if (address.trim().startsWith("{")) {
        try {
          return formatAddressString(JSON.parse(address));
        } catch {
          return address;
        }
      }
      return address;
    }

    if (typeof address === "object") {
      const parts = [
        address.line1,
        address.line2,
        address.city,
        address.state,
        address.pincode,
        address.country,
      ].filter(Boolean);

      return parts.length > 0 ? parts.join(", ") : "Store Pickup";
    }

    return "Store Pickup";
  };

  // Normalize shippingAddress: if it's a JSON string, parse it into an object
  const rawShippingAddress = order?.shippingAddress;
  const shippingAddress = (() => {
    if (
      typeof rawShippingAddress === "string" &&
      rawShippingAddress.trim().startsWith("{")
    ) {
      try {
        return JSON.parse(rawShippingAddress);
      } catch {
        return rawShippingAddress;
      }
    }
    return rawShippingAddress;
  })();

  let formattedShippingAddress: string = "Store Pickup";

  let addressLine1: string = "";
  let addressCity: string = "";
  let addressState: string = "";
  let addressPincode: string = "";
  let addressCountry: string = "";

  const extractFieldsFromObject = (obj: any) => {
    if (obj.line1) addressLine1 = obj.line1;
    if (obj.city) addressCity = obj.city;
    if (obj.state) addressState = obj.state;
    if (obj.pincode) addressPincode = obj.pincode;
    if (obj.country) addressCountry = obj.country;
  };

  if (
    typeof shippingAddress === "string" &&
    shippingAddress.trim().length > 0
  ) {
    formattedShippingAddress = shippingAddress;
    const parts = shippingAddress.split(",");
    if (parts.length >= 3) {
      addressLine1 = parts[1]?.trim() || "";
      addressCity = parts[2]?.trim() || "";
      const statePart = parts[3]?.trim() || "";
      const statePincodeParts = statePart.split("-");
      addressState = statePincodeParts[0]?.trim() || "";
      addressPincode = statePincodeParts[1]?.trim() || "";
      addressCountry = parts[4]?.trim() || "";
    }
  } else if (
    shippingAddress &&
    typeof shippingAddress === "object" &&
    shippingAddress.address
  ) {
    formattedShippingAddress =
      typeof shippingAddress.address === "string"
        ? shippingAddress.address
        : formatAddressString(shippingAddress.address);
    extractFieldsFromObject(shippingAddress);
  } else if (shippingAddress && typeof shippingAddress === "object") {
    formattedShippingAddress = formatAddressString(shippingAddress);
    extractFieldsFromObject(shippingAddress);
  }

  // Create comma-separated address string
  const addressParts = [
    addressLine1,
    addressCity,
    addressState,
    addressPincode,
    addressCountry,
  ].filter(Boolean); // Remove empty values
  const fullAddressString =
    addressParts.length > 0
      ? addressParts.join(", ")
      : formattedShippingAddress;

  const orderData = {
    id: order?.orderNo || order?.orderNumber || order?.id || "N/A",
    orderId: order?.orderId || order?.id,
    orderNumber: order?.orderNo || order?.orderNumber || order?.id || "N/A",
    items: (order?.orderItems || order?.items || order?.products || []).map(
      (it: any) => {
        // Try multiple possible product ID fields from different API response structures
        const productId =
          it.productId ||
          it.product_id ||
          it.id ||
          it._id ||
          it.productERPId ||
          it.productNumber ||
          `product_${Math.random().toString(36).substr(2, 9)}`;
        const name =
          it.fullName ||
          it.name ||
          it.productName ||
          it.product_name ||
          "Product";
        const price = Number(
          it.actual ?? it.price ?? it.sp ?? it.selling_price ?? 0,
        ); // Rate
        const quantity = Number(it.quantity ?? 1); // Qty
        const amount = price * quantity; // Amount = Rate × Qty

        return {
          id: productId,
          productId: productId, // Store actual product ID for reordering
          name: name, // Item Name
          price: price, // Rate
          originalPrice: Number(it.mrp ?? it.original_price ?? 0),
          quantity: quantity, // Qty
          amount: amount, // Amount = Rate × Qty
          image:
            it.signedImage ||
            it.image ||
            it.images?.primary ||
            (Array.isArray(it.images) ? it.images[0] : undefined) ||
            "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg",
          // Additional fields if available
          variant: it.variant,
          packing: it.packing || it.variant?.unit || "",
          discount: Number(it.discount || it.discountAmount || 0),
          tax: Number(it.tax || it.taxAmount || 0),
        };
      },
    ),
    itemTotal: Number(
      order?.subtotalAmount || order?.itemTotal || order?.total || 0,
    ),
    deliveryFee: Number(order?.shippingAmount || order?.deliveryFee || 0),
    discount: Number(order?.storeDiscount || order?.discount || 0),
    taxTotal: Number(
      order?.taxAmount ??
        order?.tax ??
        (order?.orderItems || order?.items || []).reduce(
          (sum: number, it: any) => sum + Number(it.tax ?? it.taxAmount ?? 0),
          0,
        ),
    ),
    grandTotal: Number(
      order?.totalAmount || order?.grandTotal || order?.total || 0,
    ),
    paymentMode:
      normalizedPaymentMode === "online"
        ? "Online"
        : normalizedPaymentMode === "offline"
          ? "Offline"
          : "Unknown",
    paymentStatus: normalizedPaymentStatus,
    orderType:
      order?.deliveryMethod === "store" ||
      order?.deliveryMethod === "store_pickup"
        ? "Store Pickup"
        : "Home Delivery",
    address:
      formattedShippingAddress ||
      formatAddressString(order?.address) ||
      "Store Pickup",
    orderDate: order?.createdAt
      ? new Date(order.createdAt).toLocaleDateString()
      : order?.date
        ? new Date(order.date).toLocaleDateString()
        : order?.orderDate || new Date().toLocaleDateString(),
    status: order?.status || "Processing",
  };

  const handleDownloadInvoice = () => {
    if (!order) {
      Alert.alert("Error", "Order data not available");
      return;
    }

    // Ensure all details are properly passed to invoice preview
    const itemsWithAmount = orderData.items.map((item: any) => {
      const price = item.price || 0;
      const quantity = item.quantity || 1;
      const amount = item.amount || price * quantity;
      return {
        ...item,
        // Ensure amount is calculated if not present
        amount: amount,
        // Ensure all fields are present
        name: item.name || "Unknown Product",
        quantity: quantity,
        price: price,
        discount: item.discount || 0,
        tax: item.tax || 0,
        taxAmount: item.tax || 0,
        discountAmount: item.discount || 0,
      };
    });

    // Calculate total from items if orderData.grandTotal is 0 or missing
    const calculatedTotal = itemsWithAmount.reduce(
      (sum: number, item: any) => sum + (item.amount || 0),
      0,
    );
    const orderTotal = orderData.grandTotal || 0;
    const finalTotal = orderTotal > 0 ? orderTotal : calculatedTotal;

    // Convert orderDate to ISO format if it's in DD/MM/YYYY format
    let orderDateISO = orderData.orderDate;
    if (
      orderData.orderDate &&
      typeof orderData.orderDate === "string" &&
      orderData.orderDate.includes("/")
    ) {
      // Parse DD/MM/YYYY format
      const [day, month, year] = orderData.orderDate.split("/");
      if (day && month && year) {
        orderDateISO = new Date(`${year}-${month}-${day}`).toISOString();
      }
    } else if (order?.createdAt) {
      orderDateISO = order.createdAt;
    } else if (orderData.orderDate) {
      // Try to parse as is
      const parsed = new Date(orderData.orderDate);
      orderDateISO = isNaN(parsed.getTime())
        ? new Date().toISOString()
        : parsed.toISOString();
    } else {
      orderDateISO = new Date().toISOString();
    }

    const invoiceData = {
      ...orderData,
      items: itemsWithAmount,
      total: finalTotal, // Ensure total is set correctly
      grandTotal: finalTotal, // Also set grandTotal for consistency
      orderDate: orderDateISO, // Ensure orderDate is in ISO format
      storeName: storeDetails?.name || order?.store?.name || "Store", // Include store name
      storeId: order?.storeId || "N/A", // Include store ID
      deliveryMethod: orderData.orderType || "Home Delivery",
      deliveryAddress:
        orderData.address || order.shippingAddress?.address || "Store Pickup",
    };

    // Navigate to invoice preview screen
    navigation.navigate("InvoicePreview", { orderData: invoiceData } as any);
  };

  const handleCallStore = async () => {
    try {
      const storeId =
        order?.storeId || (order as any)?.originalOrderData?.storeId;
      if (!storeId) {
        Alert.alert("Store Info", "Store information not available");
        return;
      }

      // Fetch store details to get phone number
      const response = await storeService.getStoreDetailsById(storeId);
      if (response.success && response.data) {
        const storeData = (response.data as any).data || response.data;
        const phoneNumber = storeData.mobile || storeData.phone;

        if (phoneNumber) {
          const { Linking } = require("react-native");
          Alert.alert(
            "Call Store",
            `Call ${storeData.name || "store"} at ${phoneNumber}?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Call",
                onPress: () => {
                  Linking.openURL(`tel:${phoneNumber}`).catch((err: any) => {
                    console.error("Error opening phone dialer:", err);
                    Alert.alert("Error", "Unable to open phone dialer");
                  });
                },
              },
            ],
          );
        } else {
          Alert.alert("Contact Info", "Store phone number not available");
        }
      } else {
        Alert.alert("Error", "Failed to fetch store details");
      }
    } catch (error) {
      console.error("Error calling store:", error);
      Alert.alert("Error", "Failed to initiate call");
    }
  };

  const handleReorder = async () => {
    try {
      // Use API order data if available, otherwise fallback to order
      const sourceOrder = apiOrder || order;
      const sourceItems = sourceOrder?.orderItems || sourceOrder?.items || [];

      if (!sourceItems || sourceItems.length === 0) {
        Alert.alert("Error", "No items found to reorder.");
        return;
      }

      // Get store ID for fetching current product details
      const storeId =
        sourceOrder?.storeId || order?.storeId || storeDetails?.id;
      if (!storeId) {
        Alert.alert(
          "Error",
          "Store information not found. Cannot reorder items.",
        );
        return;
      }

      // Determine store type
      const storeType =
        sourceOrder?.type || sourceOrder?.store?.type || "grocery";
      const isPharmacyStore = storeType === "pharma";

      // Process each item - fetch current details and validate
      const validItems: any[] = [];
      const invalidItems: string[] = [];

      for (const item of sourceItems) {
        try {
          // Get product ID - try multiple fields
          const productId =
            item.productId || item.productMasterId || item.id || item._id;

          if (!productId) {
            invalidItems.push(
              item.productName || item.name || "Unknown Product",
            );
            continue;
          }

          // Fetch current product details from API
          const productResponse = isPharmacyStore
            ? await storeProductService.getPharmaProductDetails(
                storeId,
                productId,
              )
            : await storeProductService.getGroceryProductDetails(
                storeId,
                productId,
              );

          if (!productResponse.success || !productResponse.data) {
            invalidItems.push(
              item.productName || item.name || "Unknown Product",
            );
            continue;
          }

          const currentProduct = productResponse.data;
          const requestedQuantity = item.quantity || 1;

          // Validate product availability and quantity
          const availableQty = currentProduct.availableQty || 0;
          const isAvailable =
            currentProduct.isAvailable !== false && availableQty > 0;

          if (!isAvailable || availableQty < requestedQuantity) {
            invalidItems.push(
              `${item.productName || item.name || "Unknown Product"} (Requested: ${requestedQuantity}, Available: ${availableQty})`,
            );
            continue;
          }

          // Get current price - use actual current price, not old price
          const currentPrice = currentProduct.price || 0;

          if (!currentPrice || currentPrice <= 0) {
            invalidItems.push(
              item.productName || item.name || "Unknown Product",
            );
            continue;
          }

          // Prepare product data with current details
          const productData = {
            id: productId,
            name:
              currentProduct.name ||
              item.productName ||
              item.name ||
              "Unknown Product",
            price: currentPrice, // Use current price
            originalPrice: currentProduct.originalPrice || currentPrice,
            image:
              currentProduct.image ||
              currentProduct.images?.[0] ||
              item.productImage ||
              item.image ||
              "https://via.placeholder.com/150",
            description:
              currentProduct.description ||
              item.productDescription ||
              item.description ||
              "",
            unit: currentProduct.unit || item.unit || "piece",
            mrp: currentProduct.originalPrice || currentPrice,
            discount:
              currentProduct.discountPercentage ||
              item.discountAmount ||
              item.discount ||
              0,
            category:
              currentProduct.category ||
              (isPharmacyStore ? "pharma" : "grocery"),
            brand: currentProduct.brand || item.brand || "",
            weight: currentProduct.weight || item.weight || "",
            expiryDate: currentProduct.expiryDate || item.expiryDate || "",
            // manufacturer: currentProduct.manufacturer || item.manufacturer || '',
            productId: productId,
            availableQty: availableQty, // Store available quantity
            prescriptionRequired: currentProduct.prescriptionRequired || false,
          };

          // Add to valid items list with quantity
          validItems.push({
            productData,
            quantity: requestedQuantity,
          });
        } catch (error) {
          invalidItems.push(item.productName || item.name || "Unknown Product");
        }
      }

      // Check if any items are valid
      if (validItems.length === 0) {
        const errorMsg =
          invalidItems.length > 0
            ? `None of the items are available:\n${invalidItems.map((name, idx) => `${idx + 1}. ${name}`).join("\n")}`
            : "No items could be added to cart. Please check product availability.";

        Alert.alert("Cannot Reorder", errorMsg);
        return;
      }

      // Add valid items to cart with correct quantity
      for (const { productData, quantity } of validItems) {
        for (let i = 0; i < quantity; i++) {
          if (isPharmacyStore) {
            addToPharmacyCart(productData);
          } else {
            addToGroceryCart(productData);
          }
        }
      }

      // Show success message with details
      let successMsg = `${validItems.length} item(s) added to cart with current prices.`;
      if (invalidItems.length > 0) {
        successMsg += `\n\n${invalidItems.length} item(s) could not be added:\n${invalidItems.map((name, idx) => `${idx + 1}. ${name}`).join("\n")}`;
      }

      Alert.alert("Success", successMsg, [{ text: "OK" }]);
    } catch (error) {
      Alert.alert("Error", "Failed to reorder items. Please try again.");
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      if (!passedOrderId) return;
      try {
        setLoading(true);
        const res = await orderListService.getOrderById(passedOrderId);

        if (res.success && res.data) {
          setApiOrder(res.data);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [passedOrderId]);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: 0,
      flex: 1,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#1F2937",
    },
    downloadButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      maxWidth: "60%",
    },
    downloadButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 4,
    },
    content: {
      flex: 1,
      marginTop: 10,
      padding: 2,
    },
    orderDateText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#374151",
      marginBottom: 14,
    },
    card: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 14,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        android: { elevation: 2 },
      }),
    },
    deliveryIconRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    deliveryLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: "#374151",
      marginLeft: 8,
    },
    deliveryArriving: {
      fontSize: 14,
      fontWeight: "500",
      color: "#374151",
      marginBottom: 8,
    },
    deliveryAddressRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginTop: 4,
    },
    viewPrescriptionBtn: {
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: "#34A853",
      alignSelf: "flex-start",
    },
    viewPrescriptionBtnText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#34A853",
    },
    itemsSectionHeader: {
      fontSize: 16,
      fontWeight: "700",
      color: "#1F2937",
      marginBottom: 14,
    },
    cardSectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#1F2937",
      marginTop: 4,
      marginBottom: 10,
      backgroundColor: "transparent",
    },
    itemRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0,0,0,0.06)",
      paddingVertical: 12,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    itemImage: {
      width: 52,
      height: 52,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: "#F3F4F6",
    },
    itemDetails: {
      flex: 1,
      minWidth: 0,
      marginRight: 10,
    },
    itemName: {
      fontSize: 14,
      fontWeight: "600",
      color: "#1F2937",
    },
    itemQuantity: {
      fontSize: 12,
      fontWeight: "500",
      color: "#6B7280",
      marginTop: 2,
    },
    itemPrice: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1F2937",
    },
    billRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    billLabel: { fontSize: 16, fontWeight: "600", color: "#374151" },
    billValue: { fontSize: 14, fontWeight: "500", color: "#374151" },
    billTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
    },
    billTotalLabel: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
    billTotalValue: { fontSize: 18, fontWeight: "700", color: "#4285F4" },
    needHelpRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    callStoreBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: 6,
    },
    callStoreBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#4285F4",
      marginLeft: 8,
    },
    reorderBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: "#4285F4",
    },
    reorderBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#FFFFFF",
      marginLeft: 8,
    },
    orderIdRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    orderIdText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
    },
    orderId: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.primary,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      marginHorizontal: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    payNowButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginVertical: 8,
    },
    payNowButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    orderDetailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    orderDetailLabel: {
      fontSize: 14,
      color: theme.colors.secondary,
    },
    orderDetailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
    addressRow: {
      marginBottom: 8,
    },
    addressValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
      marginTop: 4,
      lineHeight: 20,
      flexWrap: "wrap",
    },
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    statusText: {
      fontSize: 14,
      fontWeight: "600",
    },
    helpSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    helpTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 16,
    },
    helpButtonsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    helpButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    orderInfoCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    orderInfoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    orderInfoLabel: {
      fontSize: 14,
      fontWeight: "500",
    },
    orderInfoValue: {
      fontSize: 14,
      fontWeight: "600",
    },
    itemsCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
    },
    deliveryCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    deliveryRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    deliveryText: {
      fontSize: 14,
      marginLeft: 8,
    },
    deliveryAddress: {
      fontSize: 14,
      marginLeft: 8,
      flex: 1,
    },
    prescriptionCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    prescriptionContainer: {
      position: "relative",
      alignItems: "center",
      marginBottom: 12,
    },
    prescriptionImage: {
      width: 200,
      height: 150,
      borderRadius: 12,
      backgroundColor: "#f0f0f0",
    },
    pdfContainer: {
      width: 200,
      height: 150,
      borderRadius: 12,
    },
    prescriptionOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    prescriptionOverlayText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
      marginTop: 4,
    },
    prescriptionText: {
      fontSize: 14,
      textAlign: "center",
    },
    uploadPrescriptionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginVertical: 8,
    },
    uploadPrescriptionButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    totalCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: "500",
    },
    totalAmount: {
      fontSize: 18,
      fontWeight: "700",
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View
          style={[
            styles.container,
            { padding: 16, backgroundColor: "#FFFFFF" },
          ]}
        >
          <View style={styles.header}>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <MaterialIcons
                  name="arrow-back"
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
              <Text
                style={[styles.headerTitle, { flexShrink: 1 }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Order Details
              </Text>
            </View>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.loadingContainer}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                textAlign: "center",
                color: theme.colors.text,
              }}
            >
              Loading your orders...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={[styles.container, { padding: 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            <Text
              style={[styles.headerTitle, { flexShrink: 1 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Order Details
            </Text>
          </View>
          {/* <TouchableOpacity
            onPress={handleDownloadInvoice}
            style={styles.downloadButton}
          >
            <MaterialIcons name="file-download" size={16} color="#fff" />
            <Text style={styles.downloadButtonText} numberOfLines={1} ellipsizeMode="tail">Preview Invoice</Text>
          </TouchableOpacity> */}
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* Order date at top */}
          {orderDateFormatted ? (
            <Text style={styles.orderDateText}>{orderDateFormatted}</Text>
          ) : null}

          {/* Home Delivery / Store Info Card */}
          <LinearGradient
            colors={cardGradient}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.deliveryIconRow}>
              <MaterialCommunityIcons
                name={orderData.orderType === "Store Pickup" ? "store" : "home"}
                size={20}
                color="#4285F4"
              />
              <Text style={styles.deliveryLabel}>{orderData.orderType}</Text>
            </View>
            {/* {orderData.orderType === "Home Delivery" && arrivingByFormatted ? (
              <Text style={styles.deliveryArriving}>
                Arriving by{" "}
                {typeof arrivingByFormatted === "string" &&
                !arrivingByFormatted.includes("T") &&
                !arrivingByFormatted.includes("-")
                  ? arrivingByFormatted
                  : (() => {
                      const d = new Date(
                        arrivingByFormatted as string | number,
                      );
                      return isNaN(d.getTime())
                        ? String(arrivingByFormatted)
                        : d.toLocaleTimeString("en-IN", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          });
                    })()}
              </Text>
            ) : null} */}
            <View style={styles.deliveryAddressRow}>
              <MaterialIcons
                name="location-on"
                size={20}
                color="#4285F4"
                style={{ marginTop: 2 }}
              />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.billLabel, { fontWeight: "700" }]}>
                  {orderData.orderType === "Home Delivery"
                    ? "Delivering to:"
                    : "Pick Up From"}
                </Text>
                <Text style={[styles.billValue, { marginTop: 2 }]}>
                  {fullAddressString && fullAddressString !== "Store Pickup"
                    ? fullAddressString
                    : formattedStoreAddress || orderData.address || "—"}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Items - title outside gradient card */}
          {orderData.items.length > 0 && (
            <>
              <View style={{ backgroundColor: "transparent" }}>
                <Text style={styles.cardSectionTitle}>
                  Items ({orderData.items.length})
                </Text>
              </View>
              <LinearGradient
                colors={cardGradient}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {orderData.items.map((item: any, index: number) => (
                  <View
                    key={item.id || index}
                    style={[
                      styles.itemRowBorder,
                      index === orderData.items.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <View style={[styles.itemRow, { borderBottomWidth: 0 }]}>
                      <Image
                        source={{
                          uri:
                            item.signedImage ||
                            item.image ||
                            "https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg",
                        }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                      <View style={styles.itemDetails}>
                        <Text
                          style={styles.itemName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.itemQuantity}>
                          Qty: {item.quantity}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </LinearGradient>
            </>
          )}

          {/* Prescription Uploaded Card - show only if signedPresciptionUrl exists */}
          {prescriptionUrls.signedPresciptionUrl ? (
            <LinearGradient
              colors={cardGradient}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <MaterialCommunityIcons
                    name="file-document-check"
                    size={22}
                    color="#34A853"
                  />
                  <Text
                    style={[
                      styles.billLabel,
                      { marginLeft: 8, fontWeight: "700" },
                    ]}
                  >
                    Prescription Uploaded
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.viewPrescriptionBtn}
                  onPress={async () => {
                    try {
                      const isPdf = finalPrescriptionUrl
                        .toLowerCase()
                        .includes(".pdf");
                      if (isPdf) {
                        const can =
                          await Linking.canOpenURL(finalPrescriptionUrl);
                        if (can) await Linking.openURL(finalPrescriptionUrl);
                        else Alert.alert("Error", "Cannot open PDF.");
                      } else {
                        navigation.navigate("ImageViewer", {
                          imageUrl: finalPrescriptionUrl,
                          title: "Prescription",
                        });
                      }
                    } catch (e) {
                      Alert.alert("Error", "Could not open prescription.");
                    }
                  }}
                >
                  <Text style={styles.viewPrescriptionBtnText}>
                    View Prescription
                  </Text>
                </TouchableOpacity>
              </View>
              {/* <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <MaterialIcons
                  name="check-circle"
                  size={18}
                  color="#34A853"
                />
                <Text style={[styles.billLabel, { marginLeft: 6, fontSize: 13 }]}>
                  Verified by pharmacist
                </Text>
              </View> */}
            </LinearGradient>
          ) : null}

          {/* Payment & Bill - title outside gradient card */}
          {orderData.items.length > 0 && (
            <>
              <View style={{ backgroundColor: "transparent" }}>
                <Text style={styles.cardSectionTitle}>Payment & Bill</Text>
              </View>
              <LinearGradient
                colors={cardGradient}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { fontWeight: "700" }]}>
                    Payment Method:
                  </Text>
                  <Text
                    style={[
                      styles.billValue,
                      { color: "#4285F4", fontWeight: "600" },
                    ]}
                  >
                    {orderData.paymentMode}
                  </Text>
                </View>
                {orderData.paymentStatus === "pending" && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel} />
                    <Text style={[styles.billValue, { color: "#F59E0B" }]}>
                      Pending
                    </Text>
                  </View>
                )}
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { fontWeight: "700" }]}>
                    Items Total
                  </Text>
                  <Text style={styles.billValue}>
                    ₹{(orderData.itemTotal || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { fontWeight: "700" }]}>
                    Delivery Fee
                  </Text>
                  <Text style={styles.billValue}>
                    ₹{(orderData.deliveryFee || 0).toFixed(2)}
                  </Text>
                </View>
                {(orderData.discount || 0) > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { fontWeight: "700" }]}>
                      Savings
                    </Text>
                    <Text style={[styles.billValue, { color: "#34A853" }]}>
                      - ₹{(orderData.discount || 0).toFixed(2)}
                    </Text>
                  </View>
                )}
                {(orderData.taxTotal || 0) > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { fontWeight: "700" }]}>
                      Taxes
                    </Text>
                    <Text style={styles.billValue}>
                      ₹{(orderData.taxTotal || 0).toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={styles.billTotalRow}>
                  <Text style={styles.billTotalLabel}>Total Amount</Text>
                  <Text style={styles.billTotalValue}>
                    ₹{(orderData.grandTotal || 0).toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleDownloadInvoice}
                  style={[
                    styles.viewPrescriptionBtn,
                    { marginTop: 12, width: "100%", paddingVertical: 10 },
                  ]}
                >
                  <Text
                    style={[
                      styles.viewPrescriptionBtnText,
                      { textAlign: "center", fontSize: 12 },
                    ]}
                  >
                    View Invoice
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </>
          )}

          {/* Need Help? - title outside gradient card */}
          <View style={{ backgroundColor: "transparent" }}>
            <Text
              style={[
                styles.cardSectionTitle,
                { marginBottom: 10, textAlign: "center" },
              ]}
            >
              Need Help?
            </Text>
          </View>
          <LinearGradient
            colors={cardGradient}
            style={[styles.card, { marginBottom: 48 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View
              style={[
                styles.needHelpRow,
                Platform.OS === "web" && { flexWrap: "wrap" },
              ]}
            >
              <TouchableOpacity
                onPress={handleCallStore}
                style={styles.callStoreBtn}
              >
                <MaterialCommunityIcons
                  name="phone"
                  size={20}
                  color="#4285F4"
                />
                <Text style={styles.callStoreBtnText}>Call Store</Text>
              </TouchableOpacity>
              <Animated.View
                style={{
                  flex: 1,
                  marginLeft: 6,
                  transform: [
                    {
                      scale: reorderPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.06],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  onPress={handleReorder}
                  style={[
                    styles.reorderBtn,
                    isReorderHighlighted && {
                      borderWidth: 2,
                      borderColor: "#FFD700",
                      shadowColor: "#FFD700",
                      shadowOpacity: 0.35,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 10,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="cart-plus"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.reorderBtnText}>Reorder</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </LinearGradient>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default OrderDetailScreen;
