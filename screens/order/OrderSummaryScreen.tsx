import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import ThemedButton from '../../components/ui/ThemedButton';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { usePayment } from '../../hooks/usePayment';
import * as Location from 'expo-location';
import storeService, { formatStoreAddress, createAddressFromCoordinates } from '../../services/api/storeService';

type OrderSummaryRouteProp = RouteProp<RootStackParamList, 'OrderSummary'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OrderItem {
  id: string;
  name: string;
  price: number; // Rate
  quantity: number; // Qty
  amount?: number; // Amount (Rate × Qty)
  image: string;
  productId?: string;
  originalPrice?: number;
  variant?: any;
  packing?: string;
  discount?: number;
  tax?: number;
}

interface OrderSummary {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  deliveryMethod: string;
  deliveryAddress?: string;
  orderDate: string;
  status: string;
  storeId?: string;
  storeName?: string;
  type?: 'grocery' | 'pharma';
  signedPresciptionUrl?: string;
  signedPrescriptionUrl?: string;
  prescriptionUrl?: string;
  paymentStatus?: 'paid' | 'pending' | 'cancelled' | 'failed' | 'unknown';
  paymentMode?: 'online' | 'offline' | 'unknown';
}

const OrderSummaryScreen = () => {
  const route = useRoute<OrderSummaryRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { selectedStore } = useAppContext();
  
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formattedStoreAddress, setFormattedStoreAddress] = useState<string>('');

  const { reorderProducts, isProcessing } = usePayment({
    onSuccess: (orderData) => {
      console.log('✅ Reorder successful:', orderData);
      Alert.alert(
        'Reorder Successful!',
        'Your order has been placed successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    },
    onError: (error) => {
      console.error('❌ Reorder failed:', error);
      Alert.alert('Reorder Failed', error);
    },
  });

  useEffect(() => {
    loadOrderSummary();
  }, []);

  // Refresh data when screen comes into focus (e.g., after prescription upload)
  useFocusEffect(
    React.useCallback(() => {
      console.log('📋 OrderSummary screen focused, refreshing data...');
      loadOrderSummary();
    }, [])
  );

  const loadOrderSummary = async () => {
    try {
      setIsLoading(true);
      const orderData = route.params?.orderData;
      
      if (orderData) {
        // Try to fetch fresh order data from API first
        const orderId = orderData.orderId || orderData.id;
        let freshOrderData = orderData;
        
        if (orderId) {
          try {
            console.log('📋 Fetching fresh order data for summary:', orderId);
            const orderListService = require('../../services/api/orderListService').default;
            const response = await orderListService.getOrderById(orderId);
            
            if (response.success && response.data) {
              console.log('📋 Fresh order data fetched successfully');
              console.log('📋 Fresh order prescription fields:', {
                signedPresciptionUrl: response.data.signedPresciptionUrl,
                signedPrescriptionUrl: response.data.signedPrescriptionUrl,
                prescriptionUrl: response.data.prescriptionUrl,
              });
              freshOrderData = response.data;
            } else {
              console.log('⚠️ Failed to fetch fresh data, using passed data');
            }
          } catch (apiError) {
            console.log('⚠️ API fetch failed, using passed data:', apiError);
          }
        }
        
        // Normalize payment from multiple possible shapes
        const backendPayment = freshOrderData.payment || freshOrderData.paymentData || null;
        const backendPaymentStatus = (backendPayment?.status || freshOrderData.paymentStatus || freshOrderData.status || '').toString().toLowerCase();
        const paymentIdPresent = !!(freshOrderData.paymentId || backendPayment?.paymentId);
        let normalizedPaymentStatus: 'paid' | 'pending' | 'cancelled' | 'failed' | 'unknown' = 'unknown';
        if (['completed', 'success', 'paid'].includes(backendPaymentStatus)) normalizedPaymentStatus = 'paid';
        else if (['pending', 'processing', 'initiated'].includes(backendPaymentStatus)) normalizedPaymentStatus = 'pending';
        else if (['cancelled', 'canceled'].includes(backendPaymentStatus)) normalizedPaymentStatus = 'cancelled';
        else if (['failed', 'failure', 'error'].includes(backendPaymentStatus)) normalizedPaymentStatus = 'failed';
        // If we have paymentId but no clear status, treat as pending
        if (normalizedPaymentStatus === 'unknown' && paymentIdPresent) normalizedPaymentStatus = 'pending';

        const normalizedPaymentMode: 'online' | 'offline' | 'unknown' =
          backendPayment?.mode === 'online' || freshOrderData.paymentMethod === 'online' ? 'online'
            : backendPayment?.mode === 'offline' ? 'offline' : 'unknown';

        // Transform order data to summary format
        // Map orderItems from API to items array with all necessary details
        const mappedItems = (freshOrderData.orderItems || freshOrderData.items || freshOrderData.products || []).map((item: any) => {
          const productId = item.productId || item.productMasterId || item.id || item._id;
          const name = item.productName || item.name || 'Unknown Product';
          const price = Number(item.sp || item.price || item.actual || item.mrp || 0);
          const quantity = Number(item.quantity || 1);
          const amount = price * quantity;
          
          return {
            id: productId,
            productId: productId,
            name: name,
            price: price, // Rate
            originalPrice: Number(item.mrp || item.originalPrice || price),
            quantity: quantity, // Qty
            amount: amount, // Amount = Rate × Qty
            image: item.signedImage || item.image || item.productImage || (Array.isArray(item.images) ? item.images[0] : item.images?.primary) || 'https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg',
            // Additional fields if available
            variant: item.variant,
            packing: item.packing || item.variant?.unit || 'https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg',
            discount: Number(item.discount || item.discountAmount || 0),
            tax: Number(item.tax || item.taxAmount || 0),
          };
        });

        console.log('📋 Fresh order data prescription check:', {
          signedPresciptionUrl: freshOrderData.signedPresciptionUrl,
          signedPrescriptionUrl: freshOrderData.signedPrescriptionUrl,
          prescriptionUrl: freshOrderData.prescriptionUrl,
        });

        const summary: OrderSummary = {
          orderId: freshOrderData.orderId || freshOrderData.id,
          orderNumber: freshOrderData.orderNo || freshOrderData.orderNumber || `#${freshOrderData.orderId}`,
          items: mappedItems, // Items with name, qty, rate (price), amount calculated
          total: freshOrderData.totalAmount || freshOrderData.total || 0,
          deliveryMethod: freshOrderData.deliveryMethod || 'Store Pickup',
          deliveryAddress: freshOrderData.deliveryAddress || freshOrderData.shippingAddress,
          orderDate: freshOrderData.createdAt || freshOrderData.orderDate || new Date().toISOString(),
          status: freshOrderData.status || 'completed',
          storeId: freshOrderData.storeId || selectedStore?.id,
          storeName: selectedStore?.name || freshOrderData.storeName || freshOrderData.store?.name || 'Store',
          // Determine store type from order data first, then fallback to selected store, default to grocery
          type: freshOrderData.type || freshOrderData.store?.type || selectedStore?.type || 'grocery',
          signedPresciptionUrl: freshOrderData.signedPresciptionUrl || freshOrderData.signedPrescriptionUrl,
          signedPrescriptionUrl: freshOrderData.signedPrescriptionUrl,
          prescriptionUrl: freshOrderData.prescriptionUrl,
          paymentStatus: normalizedPaymentStatus,
          paymentMode: normalizedPaymentMode,
        };
        
        console.log('📋 Order summary with prescription:', {
          orderId: summary.orderId,
          orderNumber: summary.orderNumber,
          hasPrescription: !!(summary.signedPresciptionUrl || summary.signedPrescriptionUrl || summary.prescriptionUrl),
          prescriptionUrls: {
            signedPresciptionUrl: summary.signedPresciptionUrl,
            signedPrescriptionUrl: summary.signedPrescriptionUrl,
            prescriptionUrl: summary.prescriptionUrl,
          },
          paymentStatus: summary.paymentStatus,
          paymentMode: summary.paymentMode,
          itemsCount: summary.items?.length || 0,
        });
        
        setOrderSummary(summary);
        
        // Fetch and format store address if available (reverse geocoding + API address)
        try {
          const storeId = freshOrderData.storeId;
          if (storeId) {
            const storeRes = await storeService.getStoreDetailsById(storeId);
            if (storeRes.success && storeRes.data) {
              const rawStore = storeRes.data as any;
              const storeData = rawStore.data || rawStore;

              const coordinates = storeData.location?.coordinates as [number, number] | undefined;
              const apiAddress =
                storeData.address ||
                storeData.config?.address ||
                null;

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
                ].some((part: any) => typeof part === 'string' && part.trim().length > 0);

              // 1) Prefer nicely formatted API address if present
              if (hasAnyAddressField) {
                finalAddress = formatStoreAddress(apiAddress, coordinates);
              }
              // 2) If API address empty but coordinates present → reverse geocode
              else if (coordinates && coordinates.length === 2) {
                try {
                  const [latitude, longitude] = coordinates;
                  console.log('🗺️ OrderSummary reverse geocoding store coords:', {
                    storeId,
                    latitude,
                    longitude,
                  });

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
                      finalAddress = parts.join(', ');
                    } else {
                      finalAddress = createAddressFromCoordinates(latitude, longitude);
                    }
                  } else {
                    finalAddress = createAddressFromCoordinates(latitude, longitude);
                  }
                } catch (geoErr) {
                  console.warn('⚠️ OrderSummary reverse geocoding failed:', geoErr);
                  const [lat, lng] = coordinates;
                  finalAddress = createAddressFromCoordinates(lat, lng);
                }
              }

              if (finalAddress) {
                console.log('🏪 OrderSummary store address resolved:', finalAddress);
                setFormattedStoreAddress(finalAddress);
              }
            }
          }
        } catch (addrErr) {
          console.log('⚠️ Failed to fetch/format store address:', addrErr);
        }
      } else {
        // If no order data provided, show error
        Alert.alert('Error', 'No order data available');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading order summary:', error);
      Alert.alert('Error', 'Failed to load order summary');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to reorder items.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Login',
            onPress: () => navigation.navigate('PhoneAuth' as any, { cartType: 'pharma' }),
          },
        ]
      );
      return;
    }

    if (!orderSummary) return;

    Alert.alert(
      'Reorder Items',
      `Do you want to reorder ${orderSummary.items.length} items for ₹${orderSummary.total.toFixed(2)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reorder',
          onPress: async () => {
            try {
              await reorderProducts(orderSummary.items, orderSummary.type || 'grocery');
            } catch (error) {
              console.error('Reorder error:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return theme.colors.text;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <LoadingOverlay visible={true} message="Loading order details..." />
      </SafeAreaView>
    );
  }

  if (!orderSummary) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={theme.colors.text} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Order not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPharmaOrder = orderSummary?.type === 'pharma';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Order Summary
        </Text>
        <TouchableOpacity
          onPress={() => {
            // Ensure all details are properly passed to invoice preview
            const itemsWithAmount = orderSummary.items.map((item: any) => {
              const price = item.price || 0;
              const quantity = item.quantity || 1;
              const amount = item.amount || (price * quantity);
              return {
                ...item,
                // Ensure amount is calculated if not present
                amount: amount,
                // Ensure all fields are present
                name: item.name || 'Unknown Product',
                quantity: quantity,
                price: price,
              };
            });
            
            // Calculate total from items if orderSummary.total is 0 or missing
            const calculatedTotal = itemsWithAmount.reduce((sum, item) => sum + (item.amount || 0), 0);
            const finalTotal = orderSummary.total > 0 ? orderSummary.total : calculatedTotal;
            
            const invoiceData = {
              ...orderSummary,
              items: itemsWithAmount,
              total: finalTotal, // Ensure total is set correctly
            };
            console.log('📄 Navigating to InvoicePreview with data:', JSON.stringify(invoiceData, null, 2));
            navigation.navigate('InvoicePreview', { orderData: invoiceData } as any);
          }}
          style={[styles.downloadButton, { backgroundColor: theme.colors.primary }]}
        >
          <MaterialIcons name="file-download" size={18} color="#fff" />
          <Text style={styles.downloadButtonText}>Invoice</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Order Info */}
        <View style={[styles.orderInfoCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.orderInfoRow}>
            <Text style={[styles.orderInfoLabel, { color: theme.colors.text }]}>
              {orderSummary.status === 'pending' ? 'Order Number:' : 'Order Number:'}
            </Text>
            <Text style={[styles.orderInfoValue, { color: theme.colors.primary }]}>
              {orderSummary.status === 'pending' ? orderSummary.orderNumber : orderSummary.orderNumber}
            </Text>
          </View>
          
          <View style={styles.orderInfoRow}>
            <Text style={[styles.orderInfoLabel, { color: theme.colors.text }]}>
              Order Date:
            </Text>
            <Text style={[styles.orderInfoValue, { color: theme.colors.text }]}>
              {formatDate(orderSummary.orderDate)}
            </Text>
          </View>
          
          <View style={styles.orderInfoRow}>
            <Text style={[styles.orderInfoLabel, { color: theme.colors.text }]}>
              Status:
            </Text>
            <Text style={[styles.orderInfoValue, { color: getStatusColor(orderSummary.status) }]}>
              {orderSummary.status.charAt(0).toUpperCase() + orderSummary.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View style={[styles.itemsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Items ({orderSummary.items.length})
          </Text>
          
          {orderSummary.items.map((item, index) => (
            <View key={item.id || index} style={styles.itemRow}>
              <Image
                source={{ uri: item.image || 'https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg' }}
                style={styles.itemImage}
              />
              
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.itemQuantity, { color: theme.colors.secondary }]}>
                  Qty: {item.quantity}
                </Text>
              </View>
              
              <Text style={[styles.itemPrice, { color: theme.colors.text }]}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery / Store Info with decoded coordinates */}
        <View style={[styles.deliveryCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {orderSummary.deliveryMethod === 'Store Pickup' ? 'Store Information' : 'Delivery Information'}
          </Text>
          
          <View style={styles.deliveryRow}>
            <MaterialCommunityIcons name={orderSummary.deliveryMethod === 'Store Pickup' ? 'store' : 'truck-delivery'} size={20} color={theme.colors.primary} />
            <Text style={[styles.deliveryText, { color: theme.colors.text }]}>{orderSummary.deliveryMethod}</Text>
          </View>
          
          {(formattedStoreAddress || orderSummary.deliveryAddress) && (
            <View style={styles.deliveryRow}>
              <MaterialIcons name="location-on" size={20} color={theme.colors.secondary} />
              <Text style={[styles.deliveryAddress, { color: theme.colors.text }]}>
                {formattedStoreAddress || orderSummary.deliveryAddress}
              </Text>
            </View>
          )}
        </View>

        {/* Prescription Section - Render only when the order is placed from a pharmacy store */}
        {isPharmaOrder && (
        <View style={[styles.prescriptionCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Prescription
          </Text>
          
          {(() => {
            // PRIORITY: signedPresciptionUrl (with typo) > signedPrescriptionUrl > prescriptionUrl
            const finalPrescriptionUrl = orderSummary.signedPresciptionUrl || orderSummary.signedPrescriptionUrl || orderSummary.prescriptionUrl;
            console.log('🖼️ OrderSummary - Displaying prescription:', {
              signedPresciptionUrl: orderSummary.signedPresciptionUrl,
              signedPrescriptionUrl: orderSummary.signedPrescriptionUrl,
              prescriptionUrl: orderSummary.prescriptionUrl,
              finalUrl: finalPrescriptionUrl,
              hasPrescription: !!finalPrescriptionUrl
            });
            
            return finalPrescriptionUrl ? (
              <>
                {(() => {
                  // Check if the file is a PDF
                  const isPdf = finalPrescriptionUrl.toLowerCase().includes('.pdf') || 
                               finalPrescriptionUrl.toLowerCase().includes('application/pdf');
                  
                  if (isPdf) {
                    // For PDFs, show a PDF icon button instead of trying to render as image
                    return (
                      <TouchableOpacity
                        style={styles.prescriptionContainer}
                        onPress={async () => {
                          try {
                            console.log('📄 Opening PDF prescription:', finalPrescriptionUrl);
                            const canOpen = await Linking.canOpenURL(finalPrescriptionUrl);
                            if (canOpen) {
                              await Linking.openURL(finalPrescriptionUrl);
                            } else {
                              Alert.alert('Error', 'Cannot open PDF. Please check the file URL.');
                            }
                          } catch (error) {
                            console.error('📄 Error opening PDF:', error);
                            Alert.alert('Error', 'Failed to open PDF. Please try again.');
                          }
                        }}
                      >
                        <View style={[styles.prescriptionImage, styles.pdfContainer, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                          <MaterialIcons name="picture-as-pdf" size={64} color="#dc3545" />
                          <Text style={[styles.prescriptionOverlayText, { color: theme.colors.text, marginTop: 8 }]}>
                            PDF Document
                          </Text>
                        </View>
                        <View style={styles.prescriptionOverlay}>
                          <MaterialIcons name="open-in-new" size={24} color="#fff" />
                          <Text style={styles.prescriptionOverlayText}>Tap to open PDF</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  } else {
                    // For images, show the image preview
                    return (
                      <TouchableOpacity
                        style={styles.prescriptionContainer}
                        onPress={() => {
                          console.log('🖼️ Opening prescription image:', finalPrescriptionUrl);
                          navigation.navigate('ImageViewer', { 
                            imageUrl: finalPrescriptionUrl, 
                            title: 'Prescription' 
                          });
                        }}
                      >
                        <Image
                          source={{ uri: finalPrescriptionUrl }}
                          style={styles.prescriptionImage}
                          resizeMode="cover"
                          onError={(error) => {
                            console.error('🖼️ Prescription image load error:', error.nativeEvent.error);
                          }}
                          onLoad={() => {
                            console.log('🖼️ Prescription image loaded successfully for:', finalPrescriptionUrl);
                          }}
                        />
                        <View style={styles.prescriptionOverlay}>
                          <MaterialIcons name="zoom-in" size={24} color="#fff" />
                          <Text style={styles.prescriptionOverlayText}>Tap to view full size</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }
                })()}
                
                <Text style={[styles.prescriptionText, { color: '#4CAF50' }]}>
                  ✓ Prescription uploaded successfully
                </Text>
                <TouchableOpacity 
                style={[styles.uploadPrescriptionButton, { backgroundColor: theme.colors.primary, marginTop: 8 }]}
                onPress={() => {
                  console.log('Re-uploading prescription for order:', orderSummary.orderId);
                  navigation.navigate('UploadPrescription', { orderId: orderSummary.orderId, storeId: orderSummary.storeId } as any);
                }}>
                  <MaterialIcons name="upload" size={20} color="fff"/>
                  <Text style={styles.uploadPrescriptionButtonText}>Re-upload Prescription</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.uploadPrescriptionButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  console.log('📤 Navigating to upload prescription for order:', orderSummary.orderId);
                  navigation.navigate('UploadPrescription', { orderId: orderSummary.orderId, storeId: orderSummary.storeId } as any);
                }}
              >
                <MaterialIcons name="upload" size={20} color="#fff" />
                <Text style={styles.uploadPrescriptionButtonText}>Upload Prescription</Text>
              </TouchableOpacity>
            );
            })()}
          </View>
        )}

        {/* Payment Status - API driven (paid/pending/cancelled/failed) */}
        <View style={[styles.totalCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Payment Status:</Text>
            <Text style={[styles.totalAmount, { color: orderSummary.paymentStatus === 'paid' ? '#4CAF50' : orderSummary.paymentStatus === 'pending' ? '#FF9800' : orderSummary.paymentStatus === 'failed' ? '#F44336' : theme.colors.secondary }]}>
              {orderSummary.paymentStatus ? orderSummary.paymentStatus.toUpperCase() : 'UNKNOWN'}
            </Text>
          </View>
        </View>

        {/* Total */}
        <View style={[styles.totalCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
              Total Amount:
            </Text>
            <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
              ₹{orderSummary.total.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {/* Removed reorder button - reorder functionality is now in OrderDetailScreen */}
      {orderSummary.paymentStatus === 'pending' && (
        <View style={[styles.bottomContainer, { backgroundColor: theme.colors.surface }]}>
          <ThemedButton
            title={`Pay Now - ₹${orderSummary.total.toFixed(2)}`}
            onPress={() => navigation.navigate('PaymentMethods' as any)}
            disabled={isProcessing}
            style={styles.reorderButton}
          />
        </View>
      )}

      <LoadingOverlay
        visible={isProcessing}
        message="Placing reorder..."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 30, // Increased from 20 to 30 to bring header down further
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderInfoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  deliveryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  totalCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  bottomContainer: {
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reorderButton: {
    width: '100%',
  },
  // Prescription styles
  prescriptionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  prescriptionContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 12,
  },
  prescriptionImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  pdfContainer: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  prescriptionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prescriptionOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  prescriptionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  uploadPrescriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 8,
  },
  uploadPrescriptionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default OrderSummaryScreen;
