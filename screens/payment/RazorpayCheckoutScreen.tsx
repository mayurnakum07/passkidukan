// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import { WebView } from 'react-native-webview';
// import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { RootStackParamList } from '../../navigation/types';
// import { useTheme } from '../../contexts/ThemeContext';
// import { useAuth } from '../../contexts/AuthContext';
// import { useCart } from '../../contexts/CartContext';
// import { orderService } from '../../services/api';
// import { PlaceOrderRequest, InitiatePaymentResponse } from '../../services/api/orderService';
// import { RAZORPAY_CONFIG } from '../../services/api/razorpayConfig';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// type RazorpayCheckoutRouteProp = RouteProp<RootStackParamList, 'RazorpayCheckout'>;
// type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RazorpayCheckout'>;

// const RazorpayCheckoutScreen = () => {
//   const navigation = useNavigation<NavigationProp>();
//   const route = useRoute<RazorpayCheckoutRouteProp>();
//   const { theme } = useTheme();
//   const { user } = useAuth();
//   const { groceryItems, pharmacyItems, clearCart } = useCart();

//   const [isLoading, setIsLoading] = useState(true);
//   const [paymentData, setPaymentData] = useState<InitiatePaymentResponse | null>(null);
//   const [orderNumber, setOrderNumber] = useState<string>('');
//   const [backendPaymentId, setBackendPaymentId] = useState<string>('');
//   const [error, setError] = useState<string | null>(null);

//   const { amount, currency = 'INR', name, description, prefill, cartType, deliveryMethod } = route.params;
//   const handledRef = React.useRef<boolean>(false);
//   const timeoutRef = React.useRef<any>(null);

//   useEffect(() => {
//     initializePayment();
//   }, []);

//   // Fallback: if user stays here > 20s without any outcome, go to Thank You (pending)
//   useEffect(() => {
//     if (paymentData) {
//       if (timeoutRef.current) clearTimeout(timeoutRef.current);
//       timeoutRef.current = setTimeout(async () => {
//         if (!handledRef.current) {
//           handledRef.current = true;
//           // Check latest payment status before routing
//           try {
//             const statusRes = await orderService.getPaymentStatus(backendPaymentId || orderNumber);
//             if (statusRes.success && (statusRes.data.status === 'success')) {
//               navigation.navigate('PaymentMethods' as any, { paymentStatus: 'success', orderNo: orderNumber });
//             } else {
//               navigation.replace('OrderConfirmation' as any, {
//                 orderId: orderNumber,
//                 amount: paymentData?.amount ?? amount,
//                 paymentData: undefined,
//               });
//             }
//           } catch {
//             navigation.replace('OrderConfirmation' as any, {
//               orderId: orderNumber,
//               amount: paymentData?.amount ?? amount,
//               paymentData: undefined,
//             });
//           }
//         }
//       }, 20000);
//     }
//     return () => {
//       if (timeoutRef.current) clearTimeout(timeoutRef.current);
//     };
//   }, [paymentData, orderNumber, amount, navigation]);

//   // Intercept back/pop: if no outcome yet, send to Thank You (pending)
//   useEffect(() => {
//     const sub = navigation.addListener('beforeRemove', async (e: any) => {
//       if (!handledRef.current) {
//         e.preventDefault();
//         handledRef.current = true;
//         if (timeoutRef.current) clearTimeout(timeoutRef.current);
//         // Check latest payment status before routing
//         try {
//           const statusRes = await orderService.getPaymentStatus(backendPaymentId || orderNumber);
//           if (statusRes.success && (statusRes.data.status === 'success')) {
//             navigation.navigate('PaymentMethods' as any, { paymentStatus: 'success', orderNo: orderNumber });
//           } else {
//             navigation.replace('OrderConfirmation' as any, {
//               orderId: orderNumber,
//               amount: paymentData?.amount ?? amount,
//               paymentData: undefined,
//             });
//           }
//         } catch {
//           navigation.replace('OrderConfirmation' as any, {
//             orderId: orderNumber,
//             amount: paymentData?.amount ?? amount,
//             paymentData: undefined,
//           });
//         }
//       }
//     });
//     return sub;
//   }, [navigation, orderNumber, paymentData, amount]);

//   const initializePayment = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);

//       // Step 1: Place the order
//       console.log('🛒 Placing order...');
//       const isStoreDelivery = deliveryMethod === 'Store Pickup';
//       const orderData: PlaceOrderRequest = {
//         products: getCartItems(),
//         deliveryMethod: isStoreDelivery ? 'store' : 'home_delivery',
//         paymentMethod: 'online',
//         // Only include address and billing details for home delivery
//         ...(isStoreDelivery ? {} : {
//           shippingAddress: getShippingAddress(), // Changed from shippingAddress to deliveryAddress
//           billingSameAsShipping: true,
//           storeDiscount: 0,
//           couponDiscount: 0,
//           shippingAmount: 0,
//           taxAmount: 0,
//           subtotalAmount: amount,
//           totalAmount: amount,
//           expressDelivery: false,
//           timeslot: undefined,
//         }),
//       };

//       console.log('📦 Order data:', JSON.stringify(orderData, null, 2));

//       const placeOrderResponse = await orderService.placeOrder(orderData);

//       if (!placeOrderResponse.success || !placeOrderResponse.data) {
//         throw new Error(placeOrderResponse.error || 'Failed to place order');
//       }

//       const orderNo = placeOrderResponse.data.orderNo;
//       setOrderNumber(orderNo);
//       console.log(' Order placed successfully:', orderNo);

//       // Clear cart immediately after order placement
//       console.log('🧹 Clearing cart immediately after order placement...');
//       await clearCart();
//       console.log(' Cart cleared after order placement');

//       // Step 2: Get payment data from place order response
//       console.log('💳 Getting payment data from place order response...');

//       // Access paymentData from the original response structure
//       const rawResponse = placeOrderResponse.data;
//       // Get paymentData from the original response (it's nested in the data field)
//       const originalResponse = placeOrderResponse.data;
//       const paymentDataFromOrder = originalResponse.paymentData;

//       console.log('💳 Raw response data:', JSON.stringify(rawResponse, null, 2));
//       console.log('💳 Payment data from order:', JSON.stringify(paymentDataFromOrder, null, 2));

//       // Calculate correct amount from products
//       const calculatedAmount = rawResponse.products?.reduce((total: number, product: any) => {
//         return total + (Number(product.price) * Number(product.quantity));
//       }, 0) || amount;

//       console.log('💰 Calculated amount from products:', calculatedAmount);
//       console.log('💰 Raw totalAmount:', rawResponse.totalAmount);

//       // Use the actual payment data from the response
//       if (paymentDataFromOrder && paymentDataFromOrder.pgKey && paymentDataFromOrder.pgReferenceId) {
//         console.log(' Using payment data from order response');
//         const transformedData: InitiatePaymentResponse = {
//           razorpay_order_id: paymentDataFromOrder.pgReferenceId,
//           razorpay_key_id: paymentDataFromOrder.pgKey,
//           amount: calculatedAmount,
//           currency: currency,
//           orderNo: orderNo,
//           paymentId: rawResponse.paymentId || orderNo,
//         };

//         console.log('🔍 Transformed payment data from order:', JSON.stringify(transformedData, null, 2));
//         setPaymentData(transformedData);
//         setBackendPaymentId(rawResponse.paymentId || orderNo);
//         console.log(' Payment data set from order response');
//       } else {
//         console.log('⚠️ No valid payment data in order response, using fallback');
//         // Create fallback payment data with correct amount
//         const fallbackPaymentData: InitiatePaymentResponse = {
//           razorpay_order_id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//           razorpay_key_id: 'rzp_test_Ogs7D6mBGChvhv',
//           amount: calculatedAmount,
//           currency: currency,
//           orderNo: orderNo,
//           paymentId: rawResponse.paymentId || orderNo,
//         };
//         setPaymentData(fallbackPaymentData);
//         setBackendPaymentId(rawResponse.paymentId || orderNo);
//         console.log(' Using fallback payment data:', JSON.stringify(fallbackPaymentData, null, 2));
//       }

//     } catch (error: any) {
//       console.error('  Payment initialization failed:', error);
//       setError(error.message || 'Failed to initialize payment');
//       Alert.alert('Error', error.message || 'Failed to initialize payment', [
//         { text: 'OK', onPress: () => navigation.goBack() }
//       ]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getCartItems = () => {
//     const items = cartType === 'grocery' ? groceryItems : pharmacyItems;
//     return items.map(item => ({
//       productId: item.id,
//       quantity: item.quantity,
//       price: item.price,
//       name: item.name,
//     }));
//   };

//   const getShippingAddress = () => {
//     // Return proper address structure for API
//     return {
//       name: user?.firstName + ' ' + user?.lastName || 'User',
//       mobile: user?.mobile || '',
//       email: user?.email || '',
//       address: '123 Main Street, Apt 4B',
//       city: 'Delhi',
//       state: 'Delhi',
//       pincode: '110001',
//       country: 'India',
//     };
//   };

//   const handlePaymentSuccess = async (razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string) => {
//     try {
//       handledRef.current = true;
//       if (timeoutRef.current) clearTimeout(timeoutRef.current);
//       console.log('🎉 PAYMENT SUCCESS CALLBACK TRIGGERED!');
//       console.log('🔍 Payment details:', { razorpayPaymentId, razorpayOrderId, razorpaySignature });
//       console.log('🔍 Backend payment ID:', backendPaymentId);
//       console.log('🔍 Order number:', orderNumber);

//       // Step 1: Fetch payment details first
//       console.log('🔄 Fetching payment details...');
//       const paymentDetailsResponse = await orderService.getPaymentStatus(backendPaymentId || orderNumber);
//       console.log('🔍 Payment details response:', JSON.stringify(paymentDetailsResponse, null, 2));

//       // Step 2: Call verify payment API
//       console.log('🔄 Calling verify payment API...');
//       console.log('📤 Verify API payload:', {
//         orderNo: orderNumber,
//         razorpayOrderId: razorpayOrderId,
//         razorpayPaymentId: razorpayPaymentId,
//         razorpaySignature: razorpaySignature,
//       });

//       const verifyResponse = await orderService.verifyPayment({
//         orderNo: orderNumber,
//         razorpayOrderId: razorpayOrderId,
//         razorpayPaymentId: razorpayPaymentId,
//         razorpaySignature: razorpaySignature,
//       });

//       console.log('🔍 Verify response:', JSON.stringify(verifyResponse, null, 2));

//       // Step 3: Clear cart and redirect to Thank You page
//       console.log('🧹 Clearing cart after payment...');
//       await clearCart();
//       console.log(' Cart cleared successfully');

//       // Small delay to ensure cart state is updated
//       await new Promise(resolve => setTimeout(resolve, 100));

//       // Redirect to Thank You page
//       navigation.navigate('OrderConfirmation' as any, { 
//         orderId: orderNumber,
//         amount: paymentData?.amount ?? 0,
//         paymentData: {
//           razorpayPaymentId,
//           razorpayOrderId,
//           razorpaySignature
//         }
//       });
//     } catch (error: any) {
//       console.error('  Payment verification failed:', error);
//       Alert.alert('Payment Verification Failed', error.message || 'Failed to verify payment');
//     }
//   };

//   const handlePaymentError = (error: any) => {
//     console.error('  Payment failed:', error);
//     handledRef.current = true;
//     if (timeoutRef.current) clearTimeout(timeoutRef.current);
//     navigation.navigate('PaymentMethods' as any, { paymentStatus: 'failed' });
//   };

//   const handlePaymentCancelled = async () => {
//     try {
//       console.log('🔄 Payment cancelled, order remains pending');
//       handledRef.current = true;
//       if (timeoutRef.current) clearTimeout(timeoutRef.current);

//       // Cart already cleared after order placement; ensure it's empty
//       await clearCart();

//       // Small delay to ensure cart state is updated
//       await new Promise(resolve => setTimeout(resolve, 100));

//       // Return to Payment Methods with cancelled status
//       navigation.navigate('PaymentMethods' as any, { paymentStatus: 'cancelled', orderNo: orderNumber });
//     } catch (error) {
//       console.error('  Error handling payment cancellation:', error);
//       navigation.goBack();
//     }
//   };

//   const generateRazorpayHTML = () => {
//     if (!paymentData) {
//       console.error('  No payment data available');
//       return '<html><body><div>No payment data available</div></body></html>';
//     }

//     // Validate required fields
//     if (!paymentData.razorpay_key_id || !paymentData.razorpay_order_id) {
//       console.error('  Missing required payment data:', {
//         key_id: paymentData.razorpay_key_id,
//         order_id: paymentData.razorpay_order_id,
//         amount: paymentData.amount
//       });
//       return '<html><body><div>Invalid payment data</div></body></html>';
//     }

//     console.log('🔍 Generating Razorpay HTML with data:', {
//       key: paymentData.razorpay_key_id,
//       amount: paymentData.amount,
//       order_id: paymentData.razorpay_order_id
//     });

//     return `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Payment</title>
//         <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
//       </head>
//       <body>
//         <script>
//           var options = {
//             "key": "${paymentData.razorpay_key_id}",
//             "amount": ${Math.round((paymentData.amount || 0) * 100)},
//             "currency": "INR",
//             "name": "E-Commerce App",
//             "description": "Order Payment",
//             "order_id": "${paymentData.razorpay_order_id}",
//             "handler": function (response) {
//               console.log('🎉 RAZORPAY PAYMENT SUCCESS!');
//               console.log('💳 Real payment response:', response);
              
//               // Real Razorpay data
//               window.ReactNativeWebView.postMessage(JSON.stringify({
//                 type: "PAYMENT_SUCCESS",
//                 data: {
//                   razorpay_order_id: response.razorpay_order_id,
//                   razorpay_payment_id: response.razorpay_payment_id,
//                   razorpay_signature: response.razorpay_signature
//                 }
//               }));
//             },
//             "modal": {
//               "ondismiss": function () {
//                 console.log('  Payment modal dismissed');
//                 window.ReactNativeWebView.postMessage(JSON.stringify({
//                   type: "PAYMENT_CANCELLED"
//                 }));
//               }
//             },
//             "theme": { 
//               "color": "#007AFF" 
//             }
//           };
          
//           console.log('Razorpay options:', options);
          
//           var rzp = new Razorpay(options);
//           rzp.open();
//         </script>
//       </body>
//       </html>
//     `;
//   };

//   const handleWebViewMessage = (event: any) => {
//     try {
//       const message = JSON.parse(event.nativeEvent.data);
//       console.log('📱 WebView message received:', message);
//       console.log('📱 Message type:', message.type);
//       console.log('📱 Message data:', message.data);

//       switch (message.type) {
//         case 'PAYMENT_SUCCESS':
//           console.log('🎉 PAYMENT_SUCCESS message received from WebView');
//           if (message.data && message.data.razorpay_payment_id) {
//             console.log(' Valid payment success data, calling handlePaymentSuccess');
//             handlePaymentSuccess(
//               message.data.razorpay_payment_id,
//               message.data.razorpay_order_id,
//               message.data.razorpay_signature
//             );
//           } else {
//             console.error('  Invalid payment success data:', message.data);
//             handlePaymentError('Invalid payment response');
//           }
//           break;
//         case 'PAYMENT_FAILED':
//           console.error('  Payment failed from WebView:', message.error);
//           handlePaymentError(message.error || 'Payment failed');
//           break;
//         case 'PAYMENT_CANCELLED':
//           console.log('🔄 Payment cancelled from WebView');
//           handlePaymentCancelled();
//           break;
//         default:
//           console.log('Unknown message type:', message.type);
//       }
//     } catch (error) {
//       console.error('  Error parsing WebView message:', error);
//       console.error('  Raw message:', event.nativeEvent.data);
//       handlePaymentError('Failed to process payment response');
//     }
//   };

//   if (isLoading) {
//     return (
//       <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={theme.colors.primary} />
//           <Text style={[styles.loadingText, { color: theme.colors.text }]}>
//             Initializing payment...
//           </Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (error) {
//     return (
//       <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
//         <View style={styles.errorContainer}>
//           <Text style={[styles.errorText, { color: theme.colors.error }]}>
//             {error}
//           </Text>
//           <TouchableOpacity
//             style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
//             onPress={initializePayment}
//           >
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (!paymentData) {
//     return (
//       <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
//         <View style={styles.errorContainer}>
//           <Text style={[styles.errorText, { color: theme.colors.error }]}>
//             Payment data not available
//           </Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
//         </TouchableOpacity>
//         <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Payment</Text>
//         <View style={{ width: 60 }} />
//       </View>

//       <WebView
//         source={{ html: generateRazorpayHTML() }}
//         style={[styles.webview, { backgroundColor: 'transparent' }]}
//         onMessage={handleWebViewMessage}
//         javaScriptEnabled={true}
//         domStorageEnabled={true}
//         startInLoadingState={true}
//         scalesPageToFit={true}
//         mixedContentMode="compatibility"
//         allowsInlineMediaPlayback={true}
//         mediaPlaybackRequiresUserAction={false}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//   },
//   backButton: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   webview: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },
//   errorText: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 24,
//   },
//   retryButton: {
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default RazorpayCheckoutScreen;




import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  BackHandler,
  ScrollView,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useAppContext } from '../../contexts/AppContext';
import { orderService } from '../../services/api';
import { addressService } from '../../services/api/addressService';
import { PlaceOrderRequest, InitiatePaymentResponse } from '../../services/api/orderService';
import { Address } from '../../services/api/addressService';
import { useToast } from '../../contexts/ToastContext';

type RazorpayCheckoutRouteProp = RouteProp<RootStackParamList, 'RazorpayCheckout'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RazorpayCheckout'>;

const RazorpayCheckoutScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RazorpayCheckoutRouteProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { selectedStore } = useAppContext();
  const { groceryItems, pharmacyItems, clearCart, resetAllContexts } = useCart();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<InitiatePaymentResponse | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [backendPaymentId, setBackendPaymentId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderConfirmationData, setOrderConfirmationData] = useState<any>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const { amount, currency = 'INR', name, description, prefill, cartType, deliveryMethod, orderId, isExistingOrder, isReorder, reorderItems } = route.params as any;
  
  // Debug route params
  console.log('🔍 RazorpayCheckout route params:', {
    amount,
    currency,
    name,
    description,
    cartType,
    deliveryMethod,
    orderId,
    isExistingOrder,
    allParams: route.params
  });
  
  // Refs to prevent multiple processing
  const handledRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const webViewRef = useRef<WebView>(null);

  // Initialize payment when component mounts
  useEffect(() => {
    const initialize = async () => {
      let loadedAddress: Address | null = null;
      
      if (deliveryMethod !== 'Store Pickup') {
        console.log('📍 Loading addresses before payment initialization...');
        loadedAddress = await loadUserAddresses();
        console.log('📍 Addresses loaded, selectedAddress:', loadedAddress);
      }
      
      // Pass the loaded address to payment initialization
      initializePayment(loadedAddress);
    };
    
    initialize();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!handledRef.current && !isProcessing) {
          handlePaymentCancelled();
        }
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isProcessing])
  );

  // Reload addresses when screen comes into focus (e.g., returning from AddAddress)
  useFocusEffect(
    useCallback(() => {
      const reloadAddresses = async () => {
        if (deliveryMethod !== 'Store Pickup' && !selectedAddress) {
          console.log('📍 Screen focused, reloading addresses...');
          await loadUserAddresses();
        }
      };
      
      reloadAddresses();
    }, [deliveryMethod, selectedAddress])
  );

  // Debug: Log when selectedAddress changes
  useEffect(() => {
    console.log('📍 selectedAddress state changed:', selectedAddress);
  }, [selectedAddress]);

  // Handle navigation back
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!handledRef.current && !isProcessing) {
        e.preventDefault();
        handlePaymentCancelled();
      }
    });

    return unsubscribe;
  }, [navigation, isProcessing]);

  // Safety timeout - if no response in 60 seconds, handle as cancelled
  useEffect(() => {
    if (paymentData && !handledRef.current) {
      timeoutRef.current = setTimeout(() => {
        if (!handledRef.current) {
          console.log('⏰ Payment timeout (60s) - handling as cancelled');
          handlePaymentCancelled();
        }
      }, 60000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [paymentData]);

  const loadUserAddresses = async (): Promise<Address | null> => {
    try {
      console.log('📍 Loading user addresses...');
      const response = await addressService.getAddresses();
      
      if (response.success && response.data) {
        // Handle nested response structure
        const responseData = response.data as any;
        const addresses = responseData.data || responseData || [];
        
        console.log('📍 Loaded addresses:', addresses);
        setAvailableAddresses(addresses);
        
        // Find and set default address
        const defaultAddress = addresses.find((addr: Address) => addr.isDefault);
        let selectedAddr: Address | null = null;
        
        if (defaultAddress) {
          selectedAddr = defaultAddress;
          setSelectedAddress(defaultAddress);
          console.log('📍 Set default address:', defaultAddress);
        } else if (addresses.length > 0) {
          // If no default, use first address
          selectedAddr = addresses[0];
          setSelectedAddress(addresses[0]);
          console.log('📍 Set first address as default:', addresses[0]);
        } else {
          setSelectedAddress(null);
          console.log('📍 No addresses found');
        }
        
        return selectedAddr;
      } else {
        console.log('  Failed to load addresses:', response.error);
        setSelectedAddress(null);
        return null;
      }
    } catch (error) {
      console.error('  Error loading addresses:', error);
      setSelectedAddress(null);
      return null;
    }
  };

  const initializePayment = async (loadedAddress?: Address | null) => {
    try {
      setIsLoading(true);
      setError(null);
      handledRef.current = false;

      console.log('🛒 Initializing payment...');
      console.log('📦 Cart type:', cartType);
      console.log('🚚 Delivery method:', deliveryMethod);
      console.log('🔄 Is existing order:', isExistingOrder);
      console.log('📦 Order ID:', orderId);
      console.log('📍 Loaded address for payment:', loadedAddress);

      // Use the loaded address or current selected address
      const addressToUse = loadedAddress || selectedAddress;
      
      console.log('📍 Address selection in initializePayment:');
      console.log('  - loadedAddress:', loadedAddress);
      console.log('  - selectedAddress:', selectedAddress);
      console.log('  - addressToUse:', addressToUse);
      
      console.log('📍 Address validation:');
      console.log('  - deliveryMethod:', deliveryMethod);
      console.log('  - loadedAddress:', loadedAddress);
      console.log('  - selectedAddress:', selectedAddress);
      console.log('  - addressToUse:', addressToUse);
      console.log('  - isExistingOrder:', isExistingOrder);

      // Check if home delivery is selected but no address is available
      if (deliveryMethod !== 'Store Pickup' && !addressToUse && !isExistingOrder) {
        console.log('  Address validation failed - no address available');
        throw new Error('Please select a delivery address to continue');
      }
      
      console.log(' Address validation passed');

      let orderNo: string;
      let orderResponseData: any;
      let paymentDataFromOrder: any;

      console.log('🔍 Checking order type:', {
        'isExistingOrder': isExistingOrder,
        'isReorder': isReorder,
        'orderId': orderId,
        'willProcessExisting': isExistingOrder && orderId && !isReorder,
        'willProcessNew': !isExistingOrder || !orderId || isReorder
      });

      if (isExistingOrder && orderId && !isReorder) {
        // For existing orders, get payment data from the order
        console.log('🔄 Processing existing order payment...');
        
        // For existing orders, we'll use the orderId as orderNo
        orderNo = orderId;
        setOrderNumber(orderNo);
        
        // Initiate payment for existing order
        console.log('💳 Initiating payment for existing order...');
        const initiatePaymentResponse = await orderService.initiatePayment(orderNo);
        
        if (initiatePaymentResponse.success && initiatePaymentResponse.data) {
          paymentDataFromOrder = initiatePaymentResponse.data;
          orderResponseData = {
            orderNo: orderNo,
            totalAmount: initiatePaymentResponse.data.amount || amount,
            paymentId: initiatePaymentResponse.data.paymentId,
          };
        } else {
          // Extract error message from response
          const errorMsg = initiatePaymentResponse.error || 'Failed to initiate payment for existing order';
          throw new Error(errorMsg);
        }
        
      } else {
        // For new orders, validate cart items are in the selected store then place the order
        console.log('🆕 Creating new order...');
        const isStoreDelivery = deliveryMethod === 'Store Pickup';
        const cartItems = getCartItems();

        console.log('📦 Cart items:', cartItems);
        console.log('📦 Cart items detailed:', JSON.stringify(cartItems, null, 2));

        // Calculate bill details (you can customize these calculations)
        const subtotal = cartItems.reduce((total: number, item: any) => total + (item.price * item.quantity), 0);
        const shippingAmount = isStoreDelivery ? 0 : 0; // Free shipping for now
        const taxAmount = 0; // No tax for now
        const totalAmount = subtotal + shippingAmount + taxAmount;

        const orderData: PlaceOrderRequest = {
          products: cartItems,
          deliveryMethod: isStoreDelivery ? 'store' : 'home',
          paymentMethod: 'online',
          type: cartType as 'pharma' | 'grocery', // Pass the cart type to specify order type
          storeId: selectedStore?.id, // Pass the selected store ID
          subtotalAmount: subtotal,
          totalAmount: totalAmount,
          ...(isStoreDelivery ? {} : {
            shippingAddress: getShippingAddress(addressToUse),
            billingSameAsShipping: true,
            billingAddress: getAddressString(addressToUse), // Convert to string format
            shippingAmount: shippingAmount,
            taxAmount: taxAmount,
            expressDelivery: false,
            timeslot: undefined, // Can be set based on user selection
          }),
        };

        console.log('🛒 Order data prepared:', JSON.stringify(orderData, null, 2));
        console.log('🛒 Order type being sent:', orderData.type);
        console.log('🛒 Products being sent:', JSON.stringify(orderData.products, null, 2));
        console.log('💰 Bill details calculated:');
        console.log('  - Cart Items Count:', cartItems.length);
        console.log('  - Subtotal:', subtotal);
        console.log('  - Shipping Amount:', shippingAmount);
        console.log('  - Tax Amount:', taxAmount);
        console.log('  - Total Amount:', totalAmount);
        console.log('📤 Placing order with data:', JSON.stringify(orderData, null, 2));

        const placeOrderResponse = await orderService.placeOrder(orderData);

        if (!placeOrderResponse.success || !placeOrderResponse.data) {
          const errorMessage = placeOrderResponse.error || 'Failed to place order';
          Alert.alert(
            'Order Cannot Be Placed',
            errorMessage,
            [{ text: 'OK' }]
          );
          throw new Error(errorMessage);
        }

        orderNo = placeOrderResponse.data.orderNo;
        setOrderNumber(orderNo);
        console.log(' Order placed successfully:', orderNo);

        orderResponseData = placeOrderResponse.data;
        paymentDataFromOrder = orderResponseData.paymentData;

        // Store order data for confirmation screen
        setOrderConfirmationData({
          items: cartItems.map((item: any) => ({
            id: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          itemTotal: subtotal,
          deliveryFee: shippingAmount,
          discount: 0, // No discount for now
          grandTotal: totalAmount,
          deliveryMethod: isStoreDelivery ? 'Store Pickup' : 'Home Delivery',
          shippingAddress: isStoreDelivery ? undefined : getAddressString(addressToUse),
          storeId: selectedStore?.id,
          storeName: selectedStore?.name,
        });
      }

      console.log('💳 Payment data from order:', JSON.stringify(paymentDataFromOrder, null, 2));
      console.log('💳 Payment data check:');
      console.log('  - paymentDataFromOrder exists:', !!paymentDataFromOrder);
      console.log('  - pgKey exists:', !!paymentDataFromOrder?.pgKey);
      console.log('  - pgKey value:', paymentDataFromOrder?.pgKey);
      console.log('  - pgReferenceId exists:', !!paymentDataFromOrder?.pgReferenceId);
      console.log('  - pgReferenceId value:', paymentDataFromOrder?.pgReferenceId);
      console.log('  - paymentDataFromOrder keys:', Object.keys(paymentDataFromOrder || {}));

      if (paymentDataFromOrder && paymentDataFromOrder.pgKey && paymentDataFromOrder.pgReferenceId) {
        const transformedData: InitiatePaymentResponse = {
          razorpay_order_id: paymentDataFromOrder.pgReferenceId,
          razorpay_key_id: paymentDataFromOrder.pgKey,
          amount: Number(orderResponseData?.totalAmount || amount),
          currency: currency,
          orderNo: orderNo,
          paymentId: orderResponseData?.paymentId || orderNo,
        };

        console.log('💰 Final payment amount:', transformedData.amount);
        console.log('🔑 Razorpay Key ID:', transformedData.razorpay_key_id);
        console.log('📦 Razorpay Order ID:', transformedData.razorpay_order_id);
        setPaymentData(transformedData);
        setBackendPaymentId(orderResponseData?.paymentId || orderNo);
        console.log(' Payment data set successfully');
      } else {
        // Check if the error is about online payment not being available
        const errorMsg = paymentDataFromOrder?.message || 'Invalid payment data received from server';
        if (errorMsg.includes('Online Payment Not Supported') || errorMsg.includes('online payment') || errorMsg.includes('payment not available')) {
          throw new Error('Online payment is currently not available for this store. Please use offline payment (Cash on Delivery) instead.');
        }
        throw new Error(errorMsg);
      }

    } catch (error: any) {
      console.error('  Payment initialization failed:', error);
      
      // Extract and format error message
      let errorMessage = error.message || 'Failed to initialize payment';
      
      // Check if error is about online payment not being supported
      if (errorMessage.includes('Online Payment Not Supported') || errorMessage.includes('online payment') || errorMessage.includes('payment not available')) {
        errorMessage = 'Online payment is currently not available for this store. Please use offline payment (Cash on Delivery) instead.';
      }
      
      // Show toast for payment initialization errors
      if (errorMessage.includes('Online payment') || errorMessage.includes('payment not available')) {
        showToast('Payment initialization failed: ' + errorMessage.substring(0, 50) + '...');
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getCartItems = () => {
    // Use reorder items if this is a reorder, otherwise use cart items
    if (isReorder && reorderItems) {
      console.log('🔄 Using reorder items:', reorderItems);
      const mappedItems = reorderItems.map((item: any) => {
        // Use the stored productId if available, otherwise extract base ID from item.id
        let actualProductId = item.productId;
        
        // If no productId stored, extract base product ID from item.id
        if (!actualProductId) {
          // Check if the item.id ends with a variant pattern like "-1", "-2", "-3"
          const variantPattern = /-\d+$/;
          if (variantPattern.test(item.id)) {
            // Remove the variant suffix (e.g., "-1", "-2", "-3")
            actualProductId = item.id.replace(variantPattern, '');
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
      console.log('🔄 Mapped reorder items:', mappedItems);
      return mappedItems;
    }
    
    const items = cartType === 'grocery' ? groceryItems : pharmacyItems;
    return items.map(item => {
      // Use the stored productId if available, otherwise extract base ID from item.id
      let actualProductId = item.productId;
      
      // If no productId stored, extract base product ID from item.id
      // item.id might have variant suffix like "productId-variantId", we need just "productId"
      if (!actualProductId) {
        // Check if the item.id ends with a variant pattern like "-1", "-2", "-3"
        const variantPattern = /-\d+$/;
        if (variantPattern.test(item.id)) {
          // Remove the variant suffix (e.g., "-1", "-2", "-3")
          actualProductId = item.id.replace(variantPattern, '');
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

  const getShippingAddress = (address?: Address | null) => {
    const addressToUse = address || selectedAddress;
    
    if (addressToUse) {
      console.log('📍 Using address:', addressToUse);
      return {
        name: `${addressToUse.firstName} ${addressToUse.lastName}`,
        mobile: addressToUse.mobile,
        email: addressToUse.email,
        address: `${addressToUse.line1}${addressToUse.line2 ? ', ' + addressToUse.line2 : ''}`,
        city: addressToUse.city,
        state: addressToUse.state,
        pincode: addressToUse.pincode,
        country: addressToUse.country,
      };
    }
    
    // Fallback to user profile or hardcoded
    console.log('📍 Using fallback address');
    return {
      name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User',
      mobile: user?.mobile || '',
      email: user?.email || '',
      address: '123 Main Street, Apt 4B',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India',
    };
  };

  const getAddressString = (address?: Address | null) => {
    const addressObj = getShippingAddress(address);
    return `${addressObj.name}, ${addressObj.address}, ${addressObj.city}, ${addressObj.state} - ${addressObj.pincode}, ${addressObj.country}`;
  };

  const handlePaymentSuccess = async (razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string) => {
    if (handledRef.current) {
      console.log('🔄 Payment success already handled, ignoring...');
      return;
    }

    try {
      handledRef.current = true;
      setIsProcessing(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      console.log('🎉 Processing payment success...');
      console.log('💳 Payment ID:', razorpayPaymentId);
      console.log('📦 Order ID:', razorpayOrderId);
      console.log('🔐 Signature:', razorpaySignature);

      // Verify payment with backend
      const verifyResponse = await orderService.verifyPayment({
        orderNo: orderNumber,
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId,
        razorpaySignature: razorpaySignature,
      });

      console.log(' Payment verification response:', verifyResponse);

      // Clear cart after successful payment
      await clearCart();
      console.log(' Cart cleared successfully');
      
      // Optional: Reset all app contexts (uncomment if needed)
      // await resetAllContexts();

      // Navigate to success page with stored order data
      navigation.replace('OrderConfirmation' as any, {
        orderId: orderNumber,
        amount: paymentData?.amount ?? amount,
        orderData: orderConfirmationData,
        paymentData: {
          razorpayPaymentId,
          razorpayOrderId,
          razorpaySignature
        }
      });

    } catch (error: any) {
      console.error('  Payment verification failed:', error);
      handledRef.current = false;
      setIsProcessing(false);
      
      Alert.alert(
        'Payment Verification Failed',
        'Your payment was successful but verification failed. Please contact support.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('OrderConfirmation' as any, {
              orderId: orderNumber,
              amount: paymentData?.amount ?? amount,
              paymentData: undefined
            })
          }
        ]
      );
    }
  };

  const handlePaymentError = (error: any) => {
    if (handledRef.current) {
      console.log('🔄 Payment error already handled, ignoring...');
      return;
    }

    handledRef.current = true;
    setIsProcessing(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    console.error('  Payment failed:', error);
    
    Alert.alert(
      'Payment Failed',
      'Your payment could not be processed. Please try again.',
      [
        {
          text: 'Try Again',
          onPress: () => {
            handledRef.current = false;
            // Reload the payment page
            if (webViewRef.current) {
              webViewRef.current.reload();
            }
          }
        },
        {
          text: 'Cancel',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const handlePaymentCancelled = async () => {
    if (handledRef.current) {
      console.log('🔄 Payment cancellation already handled, ignoring...');
      return;
    }

    handledRef.current = true;
    setIsProcessing(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    console.log('🚫 Payment cancelled by user');

    try {
      // Don't clear cart on cancellation - let user try again
      navigation.goBack();
    } catch (error) {
      console.error('  Error handling payment cancellation:', error);
      navigation.goBack();
    }
  };

  const generateRazorpayHTML = () => {
    if (!paymentData) {
      return '<html><body><div>Loading payment...</div></body></html>';
    }

    const { razorpay_key_id, razorpay_order_id, amount: paymentAmount } = paymentData;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Razorpay Payment</title>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        .loading {
            color: #666;
            font-size: 16px;
        }
        .error {
            color: #ff4444;
            font-size: 16px;
        }
        .retry-btn {
            background-color: #007AFF;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div id="status" class="loading">Initializing payment...</div>
        <button id="retryBtn" class="retry-btn" style="display: none;" onclick="initializePayment()">Retry Payment</button>
    </div>

    <script>
        let razorpayInstance = null;
        let paymentInitialized = false;

        function updateStatus(message, isError = false) {
            const statusEl = document.getElementById('status');
            const retryBtn = document.getElementById('retryBtn');
            
            statusEl.textContent = message;
            statusEl.className = isError ? 'error' : 'loading';
            retryBtn.style.display = isError ? 'block' : 'none';
        }

        function postMessage(type, data = null) {
            const message = { type, data };
            console.log('📤 Posting message to React Native:', message);
            
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(message));
            } else {
                console.error('  ReactNativeWebView not available');
            }
        }

        function initializePayment() {
            if (paymentInitialized) {
                console.log('🔄 Payment already initialized');
                return;
            }

            try {
                updateStatus('Opening payment gateway...');
                
                const options = {
                    key: "${razorpay_key_id}",
                    amount: ${Math.round((paymentAmount || 0) * 100)},
                    currency: "INR",
                    name: "E-Commerce App",
                    description: "Order Payment",
                    order_id: "${razorpay_order_id}",
                    handler: function(response) {
                        console.log('🎉 Payment successful:', response);
                        updateStatus('Payment successful! Verifying...');
                        
                        postMessage('PAYMENT_SUCCESS', {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        });
                    },
                    modal: {
                        ondismiss: function() {
                            console.log('🚫 Payment modal dismissed');
                            updateStatus('Payment cancelled');
                            
                            setTimeout(() => {
                                postMessage('PAYMENT_CANCELLED');
                            }, 500);
                        },
                        confirm_close: true,
                        escape: true,
                        backdrop_close: false
                    },
                    theme: {
                        color: "#007AFF",
                        backdrop_color: "rgba(0, 0, 0, 0.6)"
                    },
                    retry: {
                        enabled: true,
                        max_count: 3
                    },
                    timeout: 300,
                    remember_customer: false,
                    readonly: {
                        email: true,
                        contact: true
                    }
                };

                console.log('💳 Initializing Razorpay with options:', options);

                razorpayInstance = new Razorpay(options);
                
                // Handle payment failures
                razorpayInstance.on('payment.failed', function(response) {
                    console.error('  Payment failed:', response.error);
                    updateStatus('Payment failed. Please try again.', true);
                    
                    postMessage('PAYMENT_FAILED', {
                        code: response.error.code,
                        description: response.error.description,
                        source: response.error.source,
                        step: response.error.step,
                        reason: response.error.reason
                    });
                });

                paymentInitialized = true;
                razorpayInstance.open();
                
            } catch (error) {
                console.error('  Error initializing payment:', error);
                updateStatus('Failed to initialize payment', true);
                
                postMessage('PAYMENT_FAILED', {
                    message: error.message || 'Failed to initialize payment'
                });
            }
        }

        // Auto-initialize payment when page loads
        window.addEventListener('load', function() {
            console.log('📄 Page loaded, initializing payment...');
            setTimeout(initializePayment, 1000);
        });

        // Fallback initialization
        setTimeout(() => {
            if (!paymentInitialized) {
                console.log('⏰ Fallback initialization');
                initializePayment();
            }
        }, 2000);
    </script>
</body>
</html>`;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📱 WebView message received:', message);

      // Filter out internal Razorpay messages
      if (message.type && typeof message.type === 'string' && message.type.includes('updateInterfaceId')) {
        console.log('🔇 Ignoring internal Razorpay message');
        return;
      }

      switch (message.type) {
        case 'PAYMENT_SUCCESS':
          console.log('🎉 Payment success message received!');
          if (message.data?.razorpay_payment_id) {
            handlePaymentSuccess(
              message.data.razorpay_payment_id,
              message.data.razorpay_order_id,
              message.data.razorpay_signature
            );
          } else {
            handlePaymentError('Invalid payment response');
          }
          break;

        case 'PAYMENT_FAILED':
          console.log('  Payment failed message received!');
          handlePaymentError(message.data || 'Payment failed');
          break;

        case 'PAYMENT_CANCELLED':
          console.log('🚫 Payment cancelled message received!');
          handlePaymentCancelled();
          break;

        default:
          console.log('ℹ️ Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('  Error parsing WebView message:', error);
      console.error('📄 Raw message:', event.nativeEvent.data);
      // Don't treat parsing errors as payment failures
    }
  };

  const handleRetry = () => {
    setError(null);
    handledRef.current = false;
    setIsProcessing(false);
    initializePayment();
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Preparing your payment...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
            Payment Setup Failed
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {error}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleRetry}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Payment processing state
  if (isProcessing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Placing Order...
          </Text>
          <Text style={[styles.subText, { color: theme.colors.secondary }]}>
            Please wait, do not close this screen
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main payment screen
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          onPress={() => !isProcessing && handlePaymentCancelled()}
          disabled={isProcessing}
          style={styles.backButton}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Secure Payment
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Address Selector for Home Delivery */}
      {deliveryMethod !== 'Store Pickup' && (
        selectedAddress ? (
        <View style={[styles.addressSection, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.addressHeader}>
            <Text style={[styles.addressTitle, { color: theme.colors.text }]}>
              Delivery Address
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddressModal(true)}
              style={[styles.changeAddressButton, { borderColor: theme.colors.primary }]}
            >
              <Text style={[styles.changeAddressText, { color: theme.colors.primary }]}>
                Change
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.addressDetails}>
            <Text style={[styles.addressName, { color: theme.colors.text }]}>
              {`${selectedAddress.firstName} ${selectedAddress.lastName}`}
            </Text>
            <Text style={[styles.addressText, { color: theme.colors.secondary }]}>
              {selectedAddress.line1}
              {selectedAddress.line2 && `, ${selectedAddress.line2}`}
            </Text>
            <Text style={[styles.addressText, { color: theme.colors.secondary }]}>
              {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
            </Text>
            <Text style={[styles.addressText, { color: theme.colors.secondary }]}>
              {selectedAddress.mobile}
            </Text>
            {selectedAddress.isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
            {/* Debug info */}
            <Text style={[styles.addressText, { color: theme.colors.secondary, fontSize: 10 }]}>
              ID: {selectedAddress._id}
            </Text>
          </View>
        </View>
        ) : (
          <View style={[styles.noAddressSection, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.noAddressContent}>
              <Text style={[styles.noAddressTitle, { color: theme.colors.text }]}>
                No Delivery Address
              </Text>
              <Text style={[styles.noAddressText, { color: theme.colors.secondary }]}>
                Please add an address to continue with home delivery
              </Text>
              <TouchableOpacity
                style={[styles.addAddressButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  navigation.navigate('AddAddress' as any);
                }}
              >
                <Text style={styles.addAddressButtonText}>+ Add Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      )}

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity
              onPress={() => setShowAddressModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={[styles.modalCloseText, { color: theme.colors.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Select Address
            </Text>
            <View style={styles.modalSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Add New Address Option */}
            <TouchableOpacity
              style={[
                styles.addressOption,
                styles.addAddressOption,
                { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}05` }
              ]}
              onPress={() => {
                setShowAddressModal(false);
                navigation.navigate('AddAddress' as any);
              }}
            >
              <View style={styles.addressOptionContent}>
                <Text style={[styles.addAddressText, { color: theme.colors.primary }]}>
                  + Add New Address
                </Text>
              </View>
            </TouchableOpacity>

            {availableAddresses.map((address, index) => (
              <TouchableOpacity
                key={`${address._id}-${selectedAddress?._id === address._id ? 'selected' : 'unselected'}-${index}`}
                style={[
                  styles.addressOption,
                  { borderColor: theme.colors.border },
                  selectedAddress?._id === address._id && {
                    borderColor: theme.colors.primary,
                    backgroundColor: `${theme.colors.primary}10`,
                  }
                ]}
                onPress={async () => {
                  console.log('📍 User selected address:', address);
                  console.log('📍 Current selectedAddress before update:', selectedAddress);
                  
                  setSelectedAddress(address);
                  setShowAddressModal(false);
                  
                  console.log('📍 Address updated in state, re-placing order...');
                  console.log('📍 isProcessing:', isProcessing, 'paymentData:', !!paymentData);
                  
                  // Re-place order with new address if payment hasn't started yet
                  if (!isProcessing && !paymentData) {
                    console.log('📍 Address changed, re-placing order with new address...');
                    try {
                      setIsLoading(true);
                      // Use the address directly instead of relying on state
                      await initializePayment(address);
                    } catch (error) {
                      console.error('  Error re-placing order with new address:', error);
                      setError('Failed to update order with new address');
                      setIsLoading(false);
                    }
                  } else {
                    console.log('📍 Cannot re-place order - payment already in progress');
                  }
                }}
              >
                <View style={styles.addressOptionContent}>
                  <Text style={[styles.addressOptionName, { color: theme.colors.text }]}>
                    {`${address.firstName} ${address.lastName}`}
                  </Text>
                  <Text style={[styles.addressOptionText, { color: theme.colors.secondary }]}>
                    {address.line1}
                    {address.line2 && `, ${address.line2}`}
                  </Text>
                  <Text style={[styles.addressOptionText, { color: theme.colors.secondary }]}>
                    {address.city}, {address.state} - {address.pincode}
                  </Text>
                  <Text style={[styles.addressOptionText, { color: theme.colors.secondary }]}>
                    {address.mobile}
                  </Text>
                  {address.isDefault && (
                    <View style={[styles.defaultBadgeSmall, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                
                {selectedAddress?._id === address._id && (
                  <View style={styles.selectedIndicatorContainer}>
                    <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]} />
                    <Text style={[styles.selectedText, { color: theme.colors.primary }]}>Selected</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {paymentData && (
        <WebView
          ref={webViewRef}
          source={{ html: generateRazorpayHTML() }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEnabled={true}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowsBackForwardNavigationGestures={false}
          incognito={false}
          cacheEnabled={false}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={{ color: theme.colors.text, marginTop: 10 }}>
                Loading payment gateway...
              </Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('  WebView error:', nativeEvent);
            setError('Failed to load payment gateway');
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('  WebView HTTP error:', nativeEvent);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 60,
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Address selector styles
  addressSection: {
    padding: 16,
    borderBottomWidth: 1,
    backgroundColor: '#ffffff',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeAddressButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
  },
  changeAddressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addressDetails: {
    position: 'relative',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    marginBottom: 2,
  },
  defaultBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeSmall: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  defaultBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSpacer: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  addressOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressOptionContent: {
    flex: 1,
  },
  addressOptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressOptionText: {
    fontSize: 14,
    marginBottom: 2,
  },
  selectedIndicatorContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  selectedText: {
    fontSize: 10,
    fontWeight: '600',
  },
  addAddressOption: {
    borderStyle: 'dashed',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  addAddressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // No Address Section
  noAddressSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  noAddressContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAddressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noAddressText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  addAddressButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addAddressButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default RazorpayCheckoutScreen;