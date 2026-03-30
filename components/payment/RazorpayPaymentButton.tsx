import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';

interface PaymentButtonProps {
  amount: number;
  orderNo: string;
  onPaymentSuccess?: () => void;
  onPaymentFailure?: (error: string) => void;
  buttonText?: string;
  buttonStyle?: any;
  textStyle?: any;
}

const RazorpayPaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  orderNo,
  onPaymentSuccess,
  onPaymentFailure,
  buttonText = 'Pay Now',
  buttonStyle,
  textStyle,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const API_BASE = 'https://passkidukaanapi.margerp.com/v1';

  const getAuthHeaders = async () => {
    // Get your auth token from AsyncStorage or context
    const token = ''; // Replace with actual token retrieval
    return {
      'marg-customer-token': `Bearer ${token}`,
    };
  };

  const initiatePayment = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_BASE}/store/checkout/payment/initiate`,
        { orderNo },
        { headers }
      );

      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid initiate response');
      }
    } catch (error: any) {
      console.error('Initiate payment error:', error);
      throw new Error(error.response?.data?.message || 'Failed to initiate payment');
    }
  };

  const verifyPayment = async (verifyData: {
    orderNo: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_BASE}/store/checkout/payment/verify`,
        verifyData,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      console.error('Verify payment error:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  };

  const generateRazorpayHTML = (paymentData: any) => {
    const options = {
      key: paymentData.paymentData.pgKey,
      amount: Math.round(paymentData.totalAmount * 100), // Convert to paise
      currency: 'INR',
      name: 'E-Commerce App',
      description: 'Order Payment',
      order_id: paymentData.paymentData.pgReferenceId,
      prefill: {
        name: 'User Name',
        email: 'user@example.com',
        contact: '9999999999',
      },
      theme: {
        color: '#0A84FF',
      },
      handler: (response: any) => {
        console.log('Payment response:', response);
        (window as any).ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'PAYMENT_SUCCESS',
          data: response,
        }));
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal dismissed');
          (window as any).ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'PAYMENT_CANCELLED',
          }));
        },
      },
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment</title>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
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
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          .amount {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .currency {
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
          }
          .loading {
            color: #666;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="amount">₹${paymentData.totalAmount.toFixed(2)}</div>
          <div class="currency">INR</div>
          <div class="loading" id="loading">Opening payment gateway...</div>
        </div>

        <script>
          const options = ${JSON.stringify(options)};
          
          function openRazorpay() {
            console.log('Opening Razorpay with options:', options);
            
            const rzp = new Razorpay(options);
            
            rzp.on('payment.failed', function (response) {
              console.error('Payment failed:', response.error);
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'PAYMENT_FAILED',
                error: response.error,
              }));
            });
            
            rzp.open();
          }
          
          // Auto-open payment modal
          setTimeout(() => {
            console.log('Auto-opening Razorpay...');
            openRazorpay();
          }, 1000);
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', message);

      switch (message.type) {
        case 'PAYMENT_SUCCESS':
          await handlePaymentSuccess(message.data);
          break;
        case 'PAYMENT_FAILED':
          handlePaymentError(message.error);
          break;
        case 'PAYMENT_CANCELLED':
          handlePaymentCancelled();
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handlePaymentSuccess = async (razorpayResponse: any) => {
    try {
      setIsLoading(true);
      setShowWebView(false);

      console.log('Payment successful, verifying...');
      
      const verifyData = {
        orderNo: paymentData.paymentId, // Use paymentId as orderNo
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature,
      };

      console.log('Verifying payment with data:', verifyData);

      const verifyResult = await verifyPayment(verifyData);
      
      if (verifyResult?.success || verifyResult?.status === 'success') {
        Alert.alert('Success', 'Payment completed successfully!');
        onPaymentSuccess?.();
      } else {
        Alert.alert('Verification Failed', 'Payment could not be verified. Please contact support.');
        onPaymentFailure?.('Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      Alert.alert('Error', error.message || 'Payment verification failed');
      onPaymentFailure?.(error.message || 'Payment verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment failed:', error);
    setShowWebView(false);
    setIsLoading(false);
    Alert.alert('Payment Failed', 'Your payment could not be processed. Please try again.');
    onPaymentFailure?.(error?.description || 'Payment failed');
  };

  const handlePaymentCancelled = () => {
    console.log('Payment cancelled');
    setShowWebView(false);
    setIsLoading(false);
    Alert.alert('Payment Cancelled', 'Payment was cancelled by user.');
    onPaymentFailure?.('Payment cancelled');
  };

  const handlePayNow = async () => {
    try {
      setIsLoading(true);
      console.log('Initiating payment for order:', orderNo);

      const paymentData = await initiatePayment();
      console.log('Payment initiated:', paymentData);

      setPaymentData(paymentData);
      setShowWebView(true);
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      Alert.alert('Error', error.message || 'Failed to initiate payment');
      onPaymentFailure?.(error.message || 'Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (showWebView && paymentData) {
    return (
      <View style={styles.webViewContainer}>
        <WebView
          source={{ html: generateRazorpayHTML(paymentData) }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle]}
      onPress={handlePayNow}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{buttonText}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webview: {
    flex: 1,
  },
});

export default RazorpayPaymentButton;
