import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraOptions, launchCamera } from "react-native-image-picker";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import ThemedButton from "../../components/ui/ThemedButton";
import { useAppContext } from "../../contexts/AppContext";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useTheme } from "../../contexts/ThemeContext";
import { RootStackParamList } from "../../navigation/types";
import { orderService } from "../../services/api";
import { Address, addressService } from "../../services/api/addressService";
import { PlaceOrderRequest } from "../../services/api/orderService";
import prescriptionService, {
  PrescriptionFile,
} from "../../services/api/prescriptionService";
import storeService from "../../services/api/storeService";
import { Divider } from "native-base";

const deliveryMethods = [
  { id: "1", label: "Store Pickup" },
  { id: "2", label: "Home Delivery" },
];

const paymentMethods = [
  {
    id: "offline",
    label: "Pay on delivery",
    description: "Pay at store or delivery",
  },
  {
    id: "online",
    label: "Online Payment",
    description: "Pay now with Razorpay",
  },
];

// UI design tokens to match reference (works on both Android & iOS)
const UI = {
  screenBg: "#F5F6FA",
  cardBg: "#FFFFFF",
  primaryBlue: "#3F8CFF",
  lightBlue: "#ECF2FF",
  greenSelected: "#5FCF6F",
  warningOrange: "#FFA500",
  warningOrangeBg: "#FFF3E0",
  textDark: "#333333",
  textMuted: "#6B7280",
  cardRadius: 12,
  cardShadow: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: { elevation: 3 },
  }),
  warningBg: "#FFEECF",
  warningText: "#FF7700",
};

const PaymentMethodsScreen = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user, token } = useAuth();
  const { selectedStore } = useAppContext();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const {
    clearCart,
    groceryItems,
    pharmacyItems,
    groceryTotal,
    pharmacyTotal,
  } = useCart();

  // Flag: launched from "Upload Prescription" quick action
  const isFromPrescription =
    ((route.params as any)?.isFromPrescription as boolean) === true;

  // Check if this is a reorder
  const reorderItems = (route.params as any)?.reorderItems;
  const reorderTotal = (route.params as any)?.reorderTotal;
  const isReorder = (route.params as any)?.isReorder;

  // Remove payment hook - use original working logic

  const [isLoading, setIsLoading] = useState(false);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] =
    React.useState("1");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    React.useState("offline");

  // Determine cart type and totals based on reorder or regular cart
  const hasPharmacyItems =
    pharmacyItems.filter((item) => item.quantity > 0).length > 0;
  const cartType = hasPharmacyItems ? "pharma" : "grocery";

  // If user navigates here after logout (or while auth state is stale),
  // block the flow by redirecting to phone auth.
  const [hasAuthRedirected, setHasAuthRedirected] = useState(false);
  useEffect(() => {
    if ((!isAuthenticated || !token) && !hasAuthRedirected) {
      setHasAuthRedirected(true);
      navigation.replace("PhoneAuth" as any, {
        cartType: isFromPrescription ? "pharma" : cartType,
      });
    }
  }, [
    isAuthenticated,
    token,
    hasAuthRedirected,
    navigation,
    isFromPrescription,
    cartType,
  ]);

  // Use reorder totals if this is a reorder, otherwise use cart totals
  const currentItemTotal = isReorder
    ? reorderItems?.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0,
      ) || 0
    : groceryTotal + pharmacyTotal;
  const currentGrandTotal = isReorder
    ? reorderTotal || 0
    : groceryTotal + pharmacyTotal;

  // Payment processing state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<null | boolean>(null);
  const [pendingOrderAmount, setPendingOrderAmount] = useState<number>(0);

  // Address state
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [storeDetails, setStoreDetails] = useState<any>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>(
    [],
  );
  const [availableDeliveryMethods, setAvailableDeliveryMethods] = useState<
    any[]
  >([]);

  // Prescription state
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(
    null,
  );
  const [prescriptionPreviewLoading, setPrescriptionPreviewLoading] =
    useState(false);
  const [prescriptionLoadingProgress, setPrescriptionLoadingProgress] =
    useState(0);

  // Check route params for selected address on mount
  useEffect(() => {
    const routeParams = (route.params as any) || {};
    const addressFromRoute = routeParams.selectedAddress;
    if (addressFromRoute) {
      setSelectedAddress(addressFromRoute);
      // Clear the selected address from route params
      navigation.setParams({ selectedAddress: undefined } as any);
    }
  }, [route.params, navigation]);

  // Load addresses on component mount
  useEffect(() => {
    loadAddresses();
  }, []);

  // Check if cart has prescription-required items and count them
  const prescriptionRequiredCount = (() => {
    const allItems = isReorder
      ? reorderItems || []
      : [...groceryItems, ...pharmacyItems];
    return allItems.filter(
      (item: any) => item.prescriptionRequired === true && item.quantity > 0,
    ).length;
  })();

  useEffect(() => {
    // If user came from the "Upload Prescription" entry point,
    // always require a prescription file even if cart is empty.
    if (isFromPrescription) {
      setRequiresPrescription(true);
    } else {
      setRequiresPrescription(prescriptionRequiredCount > 0);
    }
  }, [prescriptionRequiredCount, isFromPrescription]);

  // Load store details and payment methods
  useEffect(() => {
    const fetchStoreDetails = async () => {
      if (selectedStore?.id) {
        try {
          const response = await storeService.getStoreDetailsById(
            selectedStore.id,
          );
          if (response.success && response.data) {
            setStoreDetails(response.data);

            // Set up available payment methods based on store config
            const storeConfig = response.data.config;
            const paymentMethods = [];
            const deliveryMethods = [];

            if (storeConfig?.paymentMethods?.online) {
              paymentMethods.push({
                id: "online",
                label: "Online Payment",
                description: "Pay now with Razorpay",
              });
            }

            if (storeConfig?.paymentMethods?.offline) {
              paymentMethods.push({
                id: "offline",
                label: "Offline Payment",
                description: "Pay at store or delivery",
              });
            }

            if (storeConfig?.deliveryMethods?.homeDelivery) {
              deliveryMethods.push({ id: "2", label: "Home Delivery" });
            }

            if (storeConfig?.deliveryMethods?.storePickup) {
              deliveryMethods.push({ id: "1", label: "Store Pickup" });
            }
            // Fallback to default methods if store config is not available
            if (paymentMethods.length === 0) {
              paymentMethods.push(
                {
                  id: "offline",
                  label: "Offline Payment",
                  description: "Pay at store or delivery",
                },
                {
                  id: "online",
                  label: "Online Payment",
                  description: "Pay now with Razorpay",
                },
              );
            }

            if (deliveryMethods.length === 0) {
              deliveryMethods.push(
                { id: "2", label: "Home Delivery" },
                { id: "1", label: "Store Pickup" },
              );
            }

            // If flow is started from Upload Prescription, force offline-only
            if (isFromPrescription) {
              const offlineOnly = paymentMethods.find(
                (m) => m.id === "offline",
              );
              setAvailablePaymentMethods(
                offlineOnly
                  ? [offlineOnly]
                  : [
                      {
                        id: "offline",
                        label: "Offline Payment",
                        description: "Pay at store or delivery",
                      },
                    ],
              );
            } else {
              setAvailablePaymentMethods(paymentMethods);
            }
            setAvailableDeliveryMethods(deliveryMethods);

            // Set default payment method - prefer offline if available
            if (paymentMethods.length > 0) {
              const offlineMethod = paymentMethods.find(
                (m) => m.id === "offline",
              );
              // In prescription flow, always lock to offline
              setSelectedPaymentMethod(
                offlineMethod
                  ? "offline"
                  : isFromPrescription
                    ? "offline"
                    : paymentMethods[0].id,
              );
            }

            // Set default delivery method to the first available one
            if (deliveryMethods.length > 0) {
              setSelectedDeliveryMethod(deliveryMethods[0].id);
            }
          } else {
            console.log(
              "⚠️ Failed to fetch store details for payment methods:",
              response.error,
            );
            // Use default payment methods
            if (isFromPrescription) {
              setAvailablePaymentMethods([
                {
                  id: "offline",
                  label: "Offline Payment",
                  description: "Pay at store or delivery",
                },
              ]);
            } else {
              setAvailablePaymentMethods(paymentMethods);
            }
            setAvailableDeliveryMethods(deliveryMethods);

            // Set default payment method - prefer offline if available
            const offlineMethod = paymentMethods.find(
              (m) => m.id === "offline",
            );
            setSelectedPaymentMethod(
              offlineMethod
                ? "offline"
                : isFromPrescription
                  ? "offline"
                  : paymentMethods[0].id,
            );
          }
        } catch (error) {
          console.error(
            "❌ Error fetching store details for payment methods:",
            error,
          );
          // Use default payment methods
          setAvailablePaymentMethods(paymentMethods);
          setAvailableDeliveryMethods(deliveryMethods);

          // Set default payment method - prefer offline if available
          const offlineMethod = paymentMethods.find((m) => m.id === "offline");
          setSelectedPaymentMethod(
            offlineMethod ? "offline" : paymentMethods[0].id,
          );
        }
      } else {
        // No store selected, use default payment methods
        if (isFromPrescription) {
          setAvailablePaymentMethods([
            {
              id: "offline",
              label: "Offline Payment",
              description: "Pay at store or delivery",
            },
          ]);
        } else {
          setAvailablePaymentMethods(paymentMethods);
        }
        setAvailableDeliveryMethods(deliveryMethods);

        // Set default payment method - prefer offline if available
        const offlineMethod = paymentMethods.find((m) => m.id === "offline");
        setSelectedPaymentMethod(
          offlineMethod
            ? "offline"
            : isFromPrescription
              ? "offline"
              : paymentMethods[0].id,
        );
      }
    };

    fetchStoreDetails();
  }, [selectedStore?.id, isFromPrescription]);

  // Handle screen focus - reload addresses and check for selected address
  useFocusEffect(
    useCallback(() => {
      // Check if we have a selected address from MyAddressesScreen
      const routeParams = (route.params as any) || {};
      const addressFromRoute = routeParams.selectedAddress;

      if (addressFromRoute) {
        setSelectedAddress(addressFromRoute);
        // Clear the selected address from route params to avoid re-selection
        navigation.setParams({ selectedAddress: undefined } as any);
        // Then reload addresses (but don't reset selectedAddress)
        loadAddresses();
      } else {
        // No address from route, just reload addresses normally
        loadAddresses();
      }
    }, [route.params, navigation]),
  );

  const loadAddresses = async () => {
    try {
      setAddressLoading(true);

      const response = await addressService.getAddresses();

      if (response.success && response.data) {
        // Handle nested response structure
        const responseData = response.data as any;
        const addressesList = responseData.data || responseData || [];

        setAddresses(addressesList);

        // Set default address as selected only if no address is already selected
        // Use a callback to check the current state to avoid stale closure
        setSelectedAddress((currentSelected) => {
          if (currentSelected) {
            // Address already selected, verify it still exists in the list
            const addressStillExists = addressesList.find(
              (addr: Address) =>
                addr.customerAddressId === currentSelected.customerAddressId ||
                addr._id === currentSelected._id,
            );
            if (addressStillExists) {
              return currentSelected; // Keep the selected address
            } else {
              // Selected address was deleted, fall through to set default
            }
          }

          // No address selected or selected address was deleted, set default
          const defaultAddress = addressesList.find(
            (addr: Address) => addr.isDefault,
          );
          if (defaultAddress) {
            return defaultAddress;
          } else if (addressesList.length > 0) {
            // If no default, use first address
            return addressesList[0];
          } else {
            // No addresses available
            return null;
          }
        });
      } else {
        setAddresses([]);
        setSelectedAddress((currentSelected) => {
          // Only clear if no address was selected
          return currentSelected || null;
        });
      }
    } catch (error) {
      setAddresses([]);
      setSelectedAddress((currentSelected) => {
        // Only clear if no address was selected
        return currentSelected || null;
      });
    } finally {
      setAddressLoading(false);
    }
  };

  // Calculate bill details: no delivery fee
  const subtotal = isReorder ? currentItemTotal : groceryTotal + pharmacyTotal;
  const total = isReorder ? currentGrandTotal : subtotal;
  const youSaved = 0; // Can be set from discount/coupon when available

  const billDetails = {
    mrp: Math.round(subtotal * 100) / 100,
    shipping: 0,
    total: Math.max(0, Math.round(total * 100) / 100),
    youSaved,
  };

  // Mock: open confirmation page without placing order (for testing UI)
  const handleMockPrescriptionConfirmation = () => {
    if (!__DEV__) return;

    navigation.navigate("OrderConfirmation", {
      orderId: `mock_pres_${Date.now()}`,
      orderNo: `PKD-MOCK-${Date.now().toString().slice(-6)}`,
      storeId: selectedStore?.id,
      storeName: selectedStore?.name,
      fromPrescriptionFlow: isFromPrescription,
      orderData: {
        prescriptionRequired: true,
        items: [],
        itemTotal: 0,
        deliveryFee: 0,
        discount: 0,
        grandTotal: 0,
        deliveryMethod:
          selectedDeliveryMethod === "1" ? "Store Pickup" : "Home Delivery",
        shippingAddress:
          selectedDeliveryMethod === "2" && selectedAddress
            ? getAddressString(selectedAddress)
            : undefined,
        storeId: selectedStore?.id,
        storeName: selectedStore?.name,
      },
    });
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated || !token) {
      // User is not logged in, go to phone auth
      navigation.navigate("PhoneAuth", { cartType });
      return;
    }

    // User is logged in, check payment method
    if (selectedPaymentMethod === "online") {
      // Show Pay Now modal first
      setPendingOrderAmount(Math.round(billDetails.total * 100) / 100);
      setPaymentSuccess(null);
      setShowPaymentModal(true);
    } else {
      // Offline payment - directly place order
      await placeOfflineOrder();
    }
  };

  const placeOfflineOrder = async () => {
    try {
      setIsLoading(true);
      setIsProcessingPayment(true);

      const isStoreDelivery = selectedDeliveryMethod === "1";

      // If flow started from Upload Prescription card, use dedicated API
      if (isFromPrescription) {
        if (!selectedPrescription) {
          Alert.alert(
            "Prescription Required",
            "Please upload your prescription before submitting.",
          );
          return;
        }

        if (!selectedStore?.id) {
          Alert.alert(
            "Store Required",
            "Please select a store before submitting your prescription.",
          );
          return;
        }

        const response = await orderService.placeOrderWithPrescription({
          storeId: selectedStore.id,
          deliveryMethod: isStoreDelivery ? "store" : "home",
          paymentMethod: "offline",
          prescriptionFile: selectedPrescription,
          ...(isStoreDelivery
            ? {}
            : {
                shippingAddress: selectedAddress || getShippingAddress(),
                billingSameAsShipping: true,
                billingAddress: getAddressString(selectedAddress),
              }),
        });

        if (response.success && response.data) {
          // Navigate to order confirmation with minimal data; backend will manage items later
          navigation.navigate("OrderConfirmation", {
            orderId: String(response.data.orderId),
            orderNo: String(response.data.orderNo),
            storeId: selectedStore?.id,
            storeName: selectedStore?.name,
            fromPrescriptionFlow: true,
            orderData: {
              prescriptionRequired: true,
              items: [],
              itemTotal: 0,
              deliveryFee: 0,
              discount: 0,
              grandTotal: 0,
              deliveryMethod: isStoreDelivery
                ? "Store Pickup"
                : "Home Delivery",
              shippingAddress:
                !isStoreDelivery && selectedAddress
                  ? getAddressString(selectedAddress)
                  : undefined,
              storeId: selectedStore?.id,
              storeName: selectedStore?.name,
            },
          });
        } else {
          const errorMessage =
            response.error ||
            "Failed to submit prescription order. Please try again.";
          Alert.alert("Order Cannot Be Placed", errorMessage, [{ text: "OK" }]);
        }
        return;
      }

      // Regular offline order flow
      const productsToOrder = isReorder ? reorderItems : getCartItems();

      const orderData: PlaceOrderRequest = {
        products: productsToOrder,
        deliveryMethod: isStoreDelivery ? "store" : "home",
        paymentMethod: "offline" as const,
        type: cartType as "pharma" | "grocery",
        storeId: selectedStore?.id,
        ...(isStoreDelivery
          ? {}
          : {
              shippingAddress: selectedAddress || getShippingAddress(),
              billingSameAsShipping: true,
              billingAddress: getAddressString(selectedAddress),
              shippingAmount: billDetails.shipping,
              taxAmount: 0,
              subtotalAmount: billDetails.mrp,
              totalAmount: billDetails.total,
              expressDelivery: false,
              timeslot: undefined,
            }),
      };

      const response = await orderService.placeOrder(orderData);

      if (response.success && response.data) {
        const orderId = String(response.data.orderId);

        // Auto-upload prescription if available and required (pharmacy orders only)
        if (
          cartType === "pharma" &&
          requiresPrescription &&
          selectedPrescription
        ) {
          try {
            await prescriptionService.storePrescriptionForOrder(
              orderId,
              selectedPrescription,
            );

            // Call API to upload prescription
            const uploadResponse = await orderService.uploadPrescription(
              orderId,
              selectedPrescription.uri,
              selectedPrescription.mimeType,
            );

            if (uploadResponse.success) {
              // Remove from local storage after successful upload
              await prescriptionService.removePrescriptionForOrder(orderId);
            } else {
            }
          } catch (uploadError) {
            // Keep prescription in local storage for manual upload later
          }
        }

        // Clear cart after successful order
        await clearCart();

        // Navigate to order confirmation screen
        const cartItems = getCartItems();
        navigation.navigate("OrderConfirmation", {
          orderId: String(response.data.orderId),
          orderNo: String(response.data.orderNo),
          storeId: selectedStore?.id,
          storeName: selectedStore?.name,
          orderData: {
            items: cartItems.map((item: any) => ({
              id: item.productId || item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: "",
            })),
            itemTotal: currentItemTotal,
            deliveryFee: 0,
            discount: 0,
            grandTotal: currentGrandTotal,
            deliveryMethod:
              selectedDeliveryMethod === "1" ? "Store Pickup" : "Home Delivery",
            shippingAddress:
              selectedDeliveryMethod === "2"
                ? getAddressString(selectedAddress)
                : undefined,
            storeId: selectedStore?.id,
            storeName: selectedStore?.name,
          },
        });
      } else {
        // Show error popup with reason
        const errorMessage =
          response.error || "Failed to place order. Please try again.";
        Alert.alert("Order Cannot Be Placed", errorMessage, [{ text: "OK" }]);
        return;
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to place order. Please try again.";
      Alert.alert("Order Cannot Be Placed", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
      setIsProcessingPayment(false);
    }
  };

  const openRazorpayCheckout = async () => {
    try {
      setIsProcessingPayment(true);

      // Check if online payment is available for this store
      if (
        storeDetails &&
        storeDetails.config &&
        !storeDetails.config.paymentMethods?.online
      ) {
        Alert.alert(
          "Online Payment Not Available",
          "Online payment is currently not available for this store. Please use offline payment (Cash on Delivery) instead.",
          [{ text: "OK" }],
        );
        setIsProcessingPayment(false);
        return;
      }

      // Use calculated total from bill details
      const totalAmount = Math.round(billDetails.total * 100) / 100;

      // Check if cart is empty
      if (totalAmount <= 0) {
        Alert.alert(
          "Empty Cart",
          "Your cart is empty. Please add items before placing an order.",
        );
        setIsProcessingPayment(false);
        return;
      }

      // Navigate to RazorpayCheckoutScreen
      navigation.navigate("RazorpayCheckout", {
        amount: totalAmount,
        currency: "INR",
        name: "E-Commerce App",
        description: `${isReorder ? "Reorder" : cartType === "pharma" ? "Pharmacy" : "Grocery"} Order`,
        prefill: {
          name: user ? `${user.firstName} ${user.lastName}` : "User Name",
          email: user?.email || "user@example.com",
          contact: user?.mobile || "9999999999",
        },
        orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cartType: cartType,
        deliveryMethod:
          selectedDeliveryMethod === "1" ? "Store Pickup" : "Home Delivery",
        isReorder: isReorder,
        reorderItems: reorderItems,
        orderNumber: `ORD${Date.now().toString().slice(-8)}`,
      });
    } catch (error: any) {
      Alert.alert(
        "Payment Error",
        "Failed to open payment gateway. Please try again.",
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Listen for payment result when coming back from Razorpay screen
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      const state = navigation.getState();
      const currentRoute = state.routes[state.index];
      const params: any = currentRoute.params;
      if (currentRoute.name === "PaymentMethods" && params?.paymentStatus) {
        const status = params.paymentStatus as
          | "success"
          | "failed"
          | "cancelled";
        if (status === "success") {
          setPaymentSuccess(true);
        } else {
          setPaymentSuccess(false);
        }
        // Clear the flag so it doesn't re-trigger
        navigation.setParams({ paymentStatus: undefined });
      }
    });
    return unsubscribe;
  }, [navigation]);

  const getCartItems = () => {
    const items = cartType === "grocery" ? groceryItems : pharmacyItems;
    // Only include items with quantity > 0
    return items
      .filter((item) => item.quantity > 0)
      .map((item) => {
        // Use the stored productId if available, otherwise extract base ID from item.id
        let actualProductId = item.productId;

        // If no productId stored, extract base product ID from item.id
        // item.id might have variant suffix like "productId-variantId", we need just "productId"
        if (!actualProductId) {
          // Check if the item.id ends with a variant pattern like "-1", "-2", "-3"
          const variantPattern = /-\d+$/;
          if (variantPattern.test(item.id)) {
            // Remove the variant suffix (e.g., "-1", "-2", "-3")
            actualProductId = item.id.replace(variantPattern, "");
          } else {
            // No variant suffix, use the full ID
            actualProductId = item.id;
          }
        }

        return {
          productId: actualProductId, // Use base product ID for API (without variant suffix)
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        };
      });
  };

  const getShippingAddress = () => {
    // Return selected address or default
    return (
      selectedAddress || {
        name: user?.firstName + " " + user?.lastName || "User",
        mobile: user?.mobile || "",
        email: user?.email || "",
        line1: "123 Main Street",
        line2: "Apt 4B",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        country: "India",
      }
    );
  };

  const getAddressString = (address?: Address | null) => {
    if (address) {
      return `${address.firstName} ${address.lastName}, ${address.line1}${address.line2 ? ", " + address.line2 : ""}, ${address.city}, ${address.state} - ${address.pincode}, ${address.country}`;
    }
    const addressObj = getShippingAddress();
    // Handle both Address type and fallback object type
    const name =
      "firstName" in addressObj
        ? `${addressObj.firstName} ${addressObj.lastName}`
        : addressObj.name;
    return `${name}, ${addressObj.line1}, ${addressObj.city}, ${addressObj.state} - ${addressObj.pincode}, ${addressObj.country}`;
  };

  const getPaymentMethodDisplay = (methodId: string) => {
    const isStore = selectedDeliveryMethod === "1";
    if (methodId === "offline") {
      return {
        label: isStore ? "Pay at Store" : "Pay at Delivery",
        description: isStore
          ? "Pay directly at store when you pickup your order"
          : "Pay directly at the time of delivery",
      };
    }
    if (methodId === "online") {
      return {
        label: "Online Payment",
        description: "Pay now for a hassle free experience",
      };
    }
    return { label: methodId, description: "" };
  };

  const handleAddressChange = () => {
    // Navigate to address selection screen
    navigation.navigate("MyAddresses" as any, { fromPaymentMethods: true });
  };

  const handleAddAddress = () => {
    navigation.navigate("LocationPicker" as any, { forAddress: true });
  };

  // Handle prescription photo capture
  const handleTakePrescriptionPhoto = async () => {
    try {
      // Request camera permission on Android (iOS permission is handled by native module)
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            "Permission Required",
            "Camera permission is required to take a photo.",
          );
          return;
        }
      }

      const options: CameraOptions = {
        mediaType: "photo",
        quality: 0.8,
        cameraType: "back",
        saveToPhotos: false,
      };

      const result: any = await new Promise((resolve) =>
        launchCamera(options, resolve),
      );

      if (result && !result.didCancel && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const prescriptionFile: PrescriptionFile = {
          uri: asset.uri,
          name: asset.fileName || `Prescription_${Date.now()}.jpg`,
          mimeType: asset.type || "image/jpeg",
          sizeBytes: asset.fileSize,
        };

        // Validate file
        const validation =
          await prescriptionService.validateFile(prescriptionFile);
        if (!validation.valid) {
          Alert.alert(
            "Invalid File",
            validation.error || "Failed to validate file",
          );
          return;
        }

        // Start preview loading/progress
        setPrescriptionLoadingProgress(0);
        setPrescriptionPreviewLoading(true);
        setSelectedPrescription(prescriptionFile);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    }
  };

  // Handle prescription file selection
  const handleSelectPrescription = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"], // Allow images and PDFs
        copyToCacheDirectory: true,
        multiple: false,
      });

      if ((result as any).canceled) return;

      const asset = (result as any).assets?.[0] || (result as any);
      if (asset && asset.uri) {
        const mimeType: string | null = asset.mimeType || asset.type || null;

        const isImage =
          mimeType?.startsWith("image/") ||
          /\.(jpg|jpeg|png|gif|webp)$/i.test(asset.name || asset.uri);

        const prescriptionFile: PrescriptionFile = {
          uri: asset.uri,
          name:
            asset.name ||
            (isImage ? "Prescription image" : "Prescription document"),
          mimeType: mimeType || "application/octet-stream",
          sizeBytes: (asset as any).fileSize || (asset as any).size,
        };

        // Validate file
        const validation =
          await prescriptionService.validateFile(prescriptionFile);
        if (!validation.valid) {
          Alert.alert(
            "Invalid File",
            validation.error || "Failed to validate file",
          );
          return;
        }

        // Start preview loading/progress
        setPrescriptionLoadingProgress(0);
        setPrescriptionPreviewLoading(true);
        setSelectedPrescription(prescriptionFile);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select file. Please try again.");
    }
  };

  // Progress simulation while preview is loading
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (prescriptionPreviewLoading) {
      interval = setInterval(() => {
        setPrescriptionLoadingProgress((prev) => {
          if (prev >= 90) return prev; // wait for actual load to finish
          return Math.min(90, prev + Math.floor(Math.random() * 10) + 5);
        });
      }, 300);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [prescriptionPreviewLoading]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: UI.screenBg,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginTop: 20,
      marginBottom: 10,
      color: UI.textDark,
    },
    sectionTitleInCard: {
      fontSize: 18,
      fontWeight: "700",
      marginTop: 0,
      marginBottom: 12,
      color: UI.textDark,
    },
    // Delivery Method: two side-by-side cards
    deliveryRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 4,
      marginBottom: 12,
    },
    deliveryCard: {
      flex: 1,
      backgroundColor: UI.cardBg,
      borderRadius: UI.cardRadius,
      padding: 14,
      borderWidth: 2,
      borderColor: "transparent",
      alignItems: "center",
      minWidth: 0,
      ...UI.cardShadow,
    },
    deliveryCardSelected: {
      backgroundColor: UI.lightBlue,
      borderColor: UI.primaryBlue,
    },
    deliveryIconLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    deliveryLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: UI.textDark,
      textAlign: "center",
    },
    deliveryLabelSelected: {
      color: UI.primaryBlue,
    },
    deliverySubtext: {
      fontSize: 10,
      color: UI.textMuted,
      marginTop: 2,
      textAlign: "center",
    },
    deliverySubtextSelected: {
      color: UI.primaryBlue,
    },
    // Deliver To
    deliverToCard: {
      backgroundColor: UI.cardBg,
      borderRadius: UI.cardRadius,
      padding: 16,
      marginBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      ...UI.cardShadow,
    },
    deliverToLabel: {
      fontSize: 14,
      color: UI.textDark,
      fontWeight: "800",
      marginBottom: 2,
    },
    deliverToAddress: {
      fontSize: 16,
      color: UI.textMuted,
    },
    editButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: UI.primaryBlue,
      borderRadius: 8,
    },
    editButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: UI.primaryBlue,
    },
    // Prescription
    prescriptionCard: {
      backgroundColor: UI.cardBg,
      borderRadius: UI.cardRadius,
      padding: 16,
      marginBottom: 16,
      ...UI.cardShadow,
    },
    prescriptionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    prescriptionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: UI.textDark,
      marginLeft: 8,
    },
    prescriptionSubtitle: {
      fontSize: 14,
      color: UI.textMuted,
      marginBottom: 12,
      lineHeight: 20,
    },
    prescriptionButtonsRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    prescriptionButton: {
      flex: 1,
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: UI.lightBlue,
      borderRadius: 10,
      borderWidth: 0.5,
      borderColor: UI.textMuted,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    prescriptionButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: UI.primaryBlue,
    },
    prescriptionWarning: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: UI.warningBg,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    prescriptionWarningText: {
      fontSize: 13,
      color: UI.warningText,
      fontWeight: "500",
      marginLeft: 8,
    },
    prescriptionSelectedCard: {
      backgroundColor: UI.cardBg,
      borderRadius: UI.cardRadius,
      padding: 16,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: UI.primaryBlue,
      ...UI.cardShadow,
    },
    prescriptionFileInfo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    prescriptionTextContainer: { flex: 1, marginLeft: 12 },
    prescriptionFileName: {
      fontSize: 14,
      fontWeight: "600",
      color: UI.textDark,
      marginBottom: 4,
    },
    prescriptionRemoveButton: { padding: 8 },
    // Payment Method - wrapper card contains title + options (shadow on wrapper only)
    paymentMethodWrapperCard: {
      backgroundColor: UI.cardBg,
      borderRadius: UI.cardRadius,
      padding: 16,
      marginBottom: 16,
      ...UI.cardShadow,
    },
    paymentMethodContainer: { marginBottom: 0 },
    paymentMethodCard: {
      backgroundColor: UI.cardBg,
      borderRadius: 10,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      flexDirection: "row",
      alignItems: "center",
    },
    paymentMethodSelected: {
      borderColor: UI.greenSelected,
      backgroundColor: "#E8F5E9",
    },
    radioButton: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: UI.textMuted,
      marginRight: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    radioButtonSelected: {
      borderColor: UI.greenSelected,
      borderWidth: 0.5,
      backgroundColor: UI.greenSelected,
    },
    radioButtonInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#fff",
    },
    paymentMethodContent: { flex: 1, minWidth: 0 },
    paymentMethodLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: UI.textDark,
    },
    paymentMethodDescription: {
      fontSize: 13,
      color: UI.textMuted,
      marginTop: 2,
    },
    paymentMethodRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    paymentAmount: {
      fontSize: 16,
      fontWeight: "600",
      color: UI.textDark,
    },
    // Order Summary
    orderSummaryCard: {
      backgroundColor: UI.cardBg,
      borderRadius: UI.cardRadius,
      padding: 16,
      marginBottom: 16,
      ...UI.cardShadow,
    },
    billRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
      alignItems: "center",
    },
    billRowText: {
      fontSize: 15,
      color: UI.textDark,
    },
    billRowAmount: {
      fontSize: 15,
      color: UI.textDark,
    },
    savedRow: {
      marginTop: 4,
      marginBottom: 8,
    },
    savedText: {
      fontSize: 14,
      color: UI.greenSelected,
      fontWeight: "500",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
    },
    totalLabel: {
      fontSize: 17,
      fontWeight: "700",
      color: UI.textDark,
    },
    totalAmount: {
      fontSize: 17,
      fontWeight: "700",
      color: UI.textDark,
    },
    estimatedDelivery: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
    },
    estimatedDeliveryText: {
      fontSize: 13,
      color: UI.textMuted,
      marginLeft: 6,
    },
    // Address (when no address / loading)
    addressCard: {
      backgroundColor: UI.cardBg,
      borderRadius: UI.cardRadius,
      padding: 16,
      marginBottom: 16,
      ...UI.cardShadow,
    },
    loadingText: {
      fontSize: 14,
      color: UI.textMuted,
      textAlign: "center",
      padding: 20,
    },
    noAddressCard: {
      backgroundColor: UI.cardBg,
      borderRadius: UI.cardRadius,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderStyle: "dashed",
      ...UI.cardShadow,
    },
    noAddressContent: { alignItems: "center" },
    noAddressTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: UI.textDark,
      marginBottom: 8,
    },
    noAddressText: {
      fontSize: 14,
      color: UI.textMuted,
      textAlign: "center",
      marginBottom: 16,
      lineHeight: 20,
    },
    addAddressButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: UI.primaryBlue,
    },
    addAddressButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
  });

  const deliverToLine =
    selectedDeliveryMethod === "2"
      ? selectedAddress
        ? [selectedAddress.line1, selectedAddress.city, selectedAddress.state]
            .filter(Boolean)
            .join(", ")
        : ""
      : selectedStore?.name
        ? `Pick up at ${selectedStore.name}`
        : "Pick up at store";

  const canShowDeliverToCard = true;

  return (
    <>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Delivery Method - two cards side by side */}
          <Text style={styles.sectionTitle}>Delivery Method</Text>
          <View style={styles.deliveryRow}>
            {availableDeliveryMethods.map((method) => {
              const isStorePickup = method.id === "1";
              const selected = selectedDeliveryMethod === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.deliveryCard,
                    selected && styles.deliveryCardSelected,
                  ]}
                  onPress={() => setSelectedDeliveryMethod(method.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.deliveryIconLine}>
                    {isStorePickup ? (
                      <MaterialCommunityIcons
                        name="storefront"
                        size={18}
                        color={selected ? UI.primaryBlue : UI.textDark}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="truck-delivery"
                        size={18}
                        color={selected ? UI.primaryBlue : UI.textDark}
                      />
                    )}
                    <Text
                      style={[
                        styles.deliveryLabel,
                        selected && styles.deliveryLabelSelected,
                      ]}
                    >
                      {method.label}
                    </Text>
                  </View>
                  {/* <Text
                    style={[
                      styles.deliverySubtext,
                      selected && styles.deliverySubtextSelected,
                    ]}
                  >
                    {isStorePickup
                      ? "Ready in 20-25 mins"
                      : `Delivery in 30-40 mins`}
                  </Text> */}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. Deliver To */}
          {canShowDeliverToCard && (
            <>
              {selectedDeliveryMethod === "2" && addressLoading ? (
                <View style={styles.deliverToCard}>
                  <View>
                    <Text style={styles.deliverToLabel}>Deliver To</Text>
                    <Text style={styles.deliverToAddress}>
                      Loading addresses...
                    </Text>
                  </View>
                </View>
              ) : selectedDeliveryMethod === "2" && selectedAddress == null ? (
                <View style={styles.noAddressCard}>
                  <View style={styles.noAddressContent}>
                    <Text style={styles.noAddressTitle}>
                      No Default Address
                    </Text>
                    <Text style={styles.noAddressText}>
                      Please add an address to continue with home delivery
                    </Text>
                    <TouchableOpacity
                      style={styles.addAddressButton}
                      onPress={handleAddAddress}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                      <Text style={styles.addAddressButtonText}>
                        Add Address
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.deliverToCard}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.deliverToLabel}>{selectedDeliveryMethod === "1"? "Pickup From" : "Deliver To"}</Text>
                    <Text
                      style={styles.deliverToAddress}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {deliverToLine || "Add address"}
                    </Text>
                  </View>
                  {selectedDeliveryMethod === "2" && (
                    <TouchableOpacity
                      onPress={handleAddressChange}
                      style={styles.editButton}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}

          {/* 3. Prescription Required */}
          {requiresPrescription && (
            <View style={styles.prescriptionCard}>
              <View style={styles.prescriptionTitleRow}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={22}
                  color={UI.textDark}
                />
                <Text style={styles.prescriptionTitle}>
                  Prescription Required
                </Text>
              </View>
              <Text style={styles.prescriptionSubtitle}>
                {isFromPrescription ? (
                  "Upload a clear photo of your prescription \nOur Pharmacist will review it and prepare your medicines"
                ) : (
                  <>
                    Your cart has {prescriptionRequiredCount} item
                    {prescriptionRequiredCount !== 1 ? "s" : ""} that require
                    {prescriptionRequiredCount === 1 ? "s" : ""} a valid
                    prescription.
                  </>
                )}
              </Text>
              {selectedPrescription ? (
                <View style={styles.prescriptionFileInfo}>
                  {selectedPrescription.mimeType?.includes("pdf") ? (
                    <MaterialIcons
                      name="picture-as-pdf"
                      size={48}
                      color={UI.primaryBlue}
                    />
                  ) : (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        overflow: "hidden",
                        backgroundColor: "#f0f0f0",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={{ uri: selectedPrescription.uri }}
                        style={{ width: 48, height: 48 }}
                        resizeMode="cover"
                        onLoadStart={() => {
                          setPrescriptionPreviewLoading(true);
                          setPrescriptionLoadingProgress(0);
                        }}
                        onLoadEnd={() => {
                          setPrescriptionLoadingProgress(100);
                          setTimeout(
                            () => setPrescriptionPreviewLoading(false),
                            250,
                          );
                        }}
                      />
                      {prescriptionPreviewLoading && (
                        <View
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: 4,
                            backgroundColor: "#eee",
                          }}
                        >
                          <View
                            style={{
                              height: 4,
                              backgroundColor: UI.primaryBlue,
                              width: `${prescriptionLoadingProgress}%`,
                            }}
                          />
                        </View>
                      )}
                    </View>
                  )}
                  <View style={styles.prescriptionTextContainer}>
                    <Text style={styles.prescriptionFileName} numberOfLines={1}>
                      {selectedPrescription.name || "Prescription"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedPrescription(null)}
                    style={styles.prescriptionRemoveButton}
                  >
                    <MaterialIcons
                      name="close"
                      size={22}
                      color={UI.warningOrange}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.prescriptionButtonsRow}>
                    <TouchableOpacity
                      style={styles.prescriptionButton}
                      onPress={handleTakePrescriptionPhoto}
                    >
                      <MaterialIcons
                        name="camera-alt"
                        size={24}
                        color={UI.primaryBlue}
                      />
                      <Text style={styles.prescriptionButtonText}>
                        Take Photo
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.prescriptionButton}
                      onPress={handleSelectPrescription}
                    >
                      <MaterialIcons
                        name="upload-file"
                        size={24}
                        color={UI.primaryBlue}
                      />
                      <Text style={styles.prescriptionButtonText}>
                        Choose File
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.prescriptionWarning}>
                    <Ionicons
                      name="warning"
                      size={20}
                      color={UI.warningOrange}
                    />
                    <Text style={styles.prescriptionWarningText}>
                      Prescription required before placing order
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* 4. Payment Method - title inside card */}
          <View style={styles.paymentMethodWrapperCard}>
            <Text style={styles.sectionTitleInCard}>Payment Method</Text>
            <View style={styles.paymentMethodContainer}>
              {availablePaymentMethods.map((method) => {
                const display = getPaymentMethodDisplay(method.id);
                const selected = selectedPaymentMethod === method.id;
                const isOnline = method.id === "online";
                // Online payment option hidden from UI — remove this block to show again
                if (method.id === "online") {
                  return null;
                }
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethodCard,
                      selected && styles.paymentMethodSelected,
                    ]}
                    onPress={() => {
                      // In prescription flow, keep payment fixed to offline / pay at store
                      if (isFromPrescription) return;
                      setSelectedPaymentMethod(method.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.radioButton,
                        selected && styles.radioButtonSelected,
                      ]}
                    >
                      {selected && <View style={styles.radioButtonInner} />}
                    </View>
                    <View style={styles.paymentMethodContent}>
                      <Text style={styles.paymentMethodLabel}>
                        {display.label}
                      </Text>
                      {isOnline && !isFromPrescription && (
                        <Text style={styles.paymentMethodDescription}>
                          UPI • Card • Netbanking
                        </Text>
                      )}
                    </View>
                    {isOnline && !isFromPrescription && (
                      <View style={styles.paymentMethodRight}>
                        <Text style={styles.paymentAmount}>
                          ₹{Number(billDetails.total).toFixed(2)}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={UI.primaryBlue}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 5. Order Summary or Prescription Info - title inside card */}
          <View style={styles.orderSummaryCard}>
            {isFromPrescription ? (
              <>
                <Text style={styles.sectionTitleInCard}>
                  What Happens Next?
                </Text>
                <View style={{ marginTop: 4 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color={UI.primaryBlue}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: UI.textDark,
                        fontWeight: "500",
                      }}
                    >
                      Prescription reviewed by pharmacist
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="pill"
                      size={18}
                      color="#FF6B6B"
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: UI.textDark,
                        fontWeight: "500",
                      }}
                    >
                      Medicines prepared for your order
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <MaterialIcons
                      name="payments"
                      size={18}
                      color="#F4B000"
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: UI.textDark,
                        fontWeight: "500",
                      }}
                    >
                      Final products & pricing shared with you
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="truck-delivery-outline"
                      size={18}
                      color="#4CAF50"
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: UI.textDark,
                        fontWeight: "500",
                      }}
                    >
                      Order delivered / ready for pickup
                    </Text>
                  </View>
                  <Divider color={UI.textMuted} />
                  <Text
                    style={{
                      fontSize: 10,
                      color: UI.textMuted,
                      textAlign: "center",
                      marginTop: 4,
                    }}
                  >
                    Final medicines & price will be confirmed by the pharmacist.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitleInCard}>Order Summary</Text>
                <View style={styles.billRow}>
                  <Text style={styles.billRowText}>Items Total</Text>
                  <Text style={styles.billRowAmount}>
                    ₹{Number(billDetails.mrp).toFixed(2)}
                  </Text>
                </View>
                {/* <View style={styles.billRow}>
                  <Text style={styles.billRowText}>Taxes</Text>
                  <Text style={styles.billRowAmount}>₹0</Text>
                </View> */}
                {billDetails.youSaved > 0 && (
                  <View style={[styles.billRow, styles.savedRow]}>
                    <Text style={styles.savedText}>
                      You Saved ₹{Number(billDetails.youSaved).toFixed(0)}
                    </Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalAmount}>
                    ₹{Number(billDetails.total).toFixed(2)}
                  </Text>
                </View>
                {/* <View style={styles.estimatedDelivery}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={UI.textMuted}
                  />
                  <Text style={styles.estimatedDeliveryText}>
                    By{" "}
                    {new Date(
                      Date.now() +
                        (selectedDeliveryMethod === "2" ? 45 : 25) * 60 * 1000,
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    •{" "}
                    {selectedDeliveryMethod === "1"
                      ? "20-25 mins"
                      : "30-40 mins"}
                  </Text>
                </View> */}
              </>
            )}
          </View>

          {/* DEV only: quick preview of confirmation UI without placing order */}
          {__DEV__ && isFromPrescription && (
            <TouchableOpacity
              onPress={handleMockPrescriptionConfirmation}
              style={{
                alignSelf: "center",
                marginTop: 8,
                marginBottom: 24,
                paddingVertical: 8,
                paddingHorizontal: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: UI.textMuted,
                  textDecorationLine: "underline",
                }}
              >
                Open Prescription Confirmation (Mock)
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* 6. Fixed bottom bar */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
            paddingBottom: Math.max(14, insets.bottom),
            backgroundColor: UI.cardBg,
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
              },
              android: { elevation: 8 },
            }),
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: UI.textDark,
            }}
          >
            {isFromPrescription
              ? "No payment now"
              : `₹${Number(billDetails.total).toFixed(2)}`}
          </Text>
          {/*
            Disable Place Order when:
            - pharma + prescription required but not selected, OR
            - home delivery selected but no delivery address exists
          */}
          {(() => {
            const isHomeDelivery = selectedDeliveryMethod === "2";
            const isHomeDeliveryAddressMissing = isHomeDelivery && !selectedAddress;
            const isPrescriptionMissing =
              cartType === "pharma" &&
              requiresPrescription &&
              !selectedPrescription;
            const isDisabled = isPrescriptionMissing || isHomeDeliveryAddressMissing;

            return (
              <TouchableOpacity
                onPress={handlePlaceOrder}
                disabled={isDisabled}
                style={{
                  backgroundColor: isDisabled ? "#9CA3AF" : UI.primaryBlue,
                  paddingVertical: 14,
                  paddingHorizontal: 28,
                  borderRadius: 12,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  {isReorder ? "Reorder Items" : "Place Order"}
                </Text>
              </TouchableOpacity>
            );
          })()}
        </View>
      </SafeAreaView>

      <LoadingOverlay
        visible={isLoading || isProcessingPayment}
        message={
          isProcessingPayment
            ? "Placing Order..."
            : selectedPaymentMethod === "online"
              ? "Opening Razorpay..."
              : "Placing order..."
        }
      />

      {/* Pay Now / Payment Successful Modal */}
      <Modal visible={showPaymentModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "#00000066",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "85%",
              borderRadius: 12,
              backgroundColor: theme.colors.surface,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: 12,
              }}
            >
              {paymentSuccess === true
                ? "Payment Successful"
                : paymentSuccess === false
                  ? "Payment Status"
                  : "Pay Now"}
            </Text>
            {paymentSuccess === null && (
              <>
                <Text
                  style={{ color: theme.colors.secondary, marginBottom: 16 }}
                >
                  Amount payable: ₹{Number(pendingOrderAmount).toFixed(2)}
                </Text>
                <ThemedButton title="Pay Now" onPress={openRazorpayCheckout} />
                <TouchableOpacity
                  onPress={() => setShowPaymentModal(false)}
                  style={{ marginTop: 12, alignSelf: "center" }}
                >
                  <Text style={{ color: theme.colors.primary }}>Not now</Text>
                </TouchableOpacity>
              </>
            )}

            {paymentSuccess !== null && (
              <>
                <Text
                  style={{ color: theme.colors.secondary, marginBottom: 16 }}
                >
                  {paymentSuccess
                    ? "Your payment was successful."
                    : "Payment not completed. You can try again from My Orders."}
                </Text>
                <ThemedButton
                  title="OK"
                  onPress={() => {
                    setShowPaymentModal(false);
                    if (paymentSuccess) {
                      // For pending orders, we don't have full order data, so use minimal data
                      navigation.navigate("OrderConfirmation" as any, {
                        amount: pendingOrderAmount,
                        storeId: selectedStore?.id,
                        storeName: selectedStore?.name,
                        orderData: {
                          items: [],
                          itemTotal: pendingOrderAmount,
                          deliveryFee: 0,
                          discount: 0,
                          grandTotal: pendingOrderAmount,
                          deliveryMethod: "Payment Pending",
                          shippingAddress: "Address not available",
                          storeId: selectedStore?.id,
                          storeName: selectedStore?.name,
                        },
                      });
                    }
                  }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

export default PaymentMethodsScreen;
