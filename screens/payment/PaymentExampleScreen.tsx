import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RazorpayPaymentButton from '../../components/payment/RazorpayPaymentButton';

const PaymentExampleScreen = () => {
  const handlePaymentSuccess = () => {
    console.log('Payment successful!');
    // Navigate to success screen, clear cart, etc.
  };

  const handlePaymentFailure = (error: string) => {
    console.log('Payment failed:', error);
    // Handle failure, show error message, etc.
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Payment Example</Text>
        <Text style={styles.amount}>Amount: ₹11.22</Text>
        <Text style={styles.orderNo}>Order: PKD-202581758205032786</Text>
        
        <RazorpayPaymentButton
          amount={11.22}
          orderNo="PKD-202581758205032786"
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          buttonText="Pay Now"
          buttonStyle={styles.payButton}
          textStyle={styles.payButtonText}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  amount: {
    fontSize: 18,
    marginBottom: 10,
    color: '#666',
  },
  orderNo: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
  },
  payButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 200,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PaymentExampleScreen;
