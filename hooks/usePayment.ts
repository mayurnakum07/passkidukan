import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { orderService } from '../services/api';
import { PlaceOrderRequest } from '../services/api/orderService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UsePaymentProps {
  onSuccess?: (orderData: any) => void;
  onError?: (error: string) => void;
}

export const usePayment = ({ onSuccess, onError }: UsePaymentProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const placeOrder = useCallback(async (orderData: PlaceOrderRequest) => {
    try {
      setIsProcessing(true);
      console.log('💳 Placing order:', JSON.stringify(orderData, null, 2));

      const response = await orderService.placeOrder(orderData);
      
      if (response.success && response.data) {
        console.log('✅ Order placed successfully:', response.data);
        
        // If payment method is online, initiate payment
        if (orderData.paymentMethod === 'online') {
          await initiatePayment(response.data, orderData);
        } else {
          // For offline payment, show success message
          Alert.alert(
            'Order Placed Successfully!',
            `Your order has been placed. Order No: ${response.data.orderNo}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigate to order confirmation
                  navigation.navigate('OrderConfirmation', {
                    orderId: String(response.data.orderId),
                    orderData: response.data as any,
                  } as any);
                },
              },
            ]
          );
        }
        
        onSuccess?.(response.data);
        return response.data;
      } else {
        const errorMessage = response.error || 'Failed to place order';
        onError?.(errorMessage);
        Alert.alert(
          'Order Cannot Be Placed',
          errorMessage,
          [{ text: 'OK' }]
        );
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Order placement failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to place order';
      onError?.(errorMessage);
      Alert.alert(
        'Order Cannot Be Placed',
        errorMessage,
        [{ text: 'OK' }]
      );
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [navigation, onSuccess, onError]);

  const initiatePayment = useCallback(async (orderData: any, originalOrderData: PlaceOrderRequest) => {
    try {
      console.log('💳 Initiating payment for order:', orderData.orderNo);
      
      // Navigate to Razorpay checkout with order data
      navigation.navigate('RazorpayCheckout', {
        orderId: String(orderData.orderId),
        amount: originalOrderData.totalAmount || 0,
        description: `Order ${orderData.orderNo}`,
        deliveryMethod: originalOrderData.deliveryMethod,
        cartType: originalOrderData.type || 'grocery',
        isReorder: true,
        reorderItems: originalOrderData.products,
      } as any);
      
    } catch (error) {
      console.error('❌ Payment initiation failed:', error);
      throw error;
    }
  }, [navigation]);

  const reorderProducts = useCallback(async (orderItems: any[], cartType: 'grocery' | 'pharma') => {
    try {
      setIsProcessing(true);
      console.log('🔄 Reordering products:', orderItems);

      const orderData: PlaceOrderRequest = {
        products: orderItems.map(item => ({
          productId: item.productId || item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        })),
        deliveryMethod: 'store', // Default to store pickup for reorders
        paymentMethod: 'online',
        type: cartType,
        storeId: orderItems[0]?.storeId,
        subtotalAmount: orderItems.reduce((total, item) => total + (item.price * item.quantity), 0),
        totalAmount: orderItems.reduce((total, item) => total + (item.price * item.quantity), 0),
      };

      return await placeOrder(orderData);
    } catch (error) {
      console.error('❌ Reorder failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [placeOrder]);

  return {
    isProcessing,
    placeOrder,
    initiatePayment,
    reorderProducts,
  };
};
