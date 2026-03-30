// services/api/orderListService.ts
import axios from 'axios';
import { ApiResponse } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OrderListItem {
  orderId: number;
  orderNo: string;
  customerId: string;
  paymentId: string;
  deliveryMethod: string;
  shippingAddress: any;
  billingAddress: any;
  products: Array<{
    sp: number;
    mrp: number;
    tax: number;
    name: string;
    actual: number;
    images: {
      primary: string;
    };
    taxRate: number;
    quantity: number;
    productId: number;
    signedImages?: {
      primary: string;
    };
  }>;
  storeDiscount: string;
  shippingAmount: string;
  taxAmount: string;
  subtotalAmount: string;
  totalAmount: string;
  otpRequired: boolean;
  otp: string;
  isOtpVerified: boolean;
  expressDelivery: boolean;
  timeslotId: string | null;
  timeslotDate: string | null;
  timeslot: any;
  status: string;
  activities: Array<{
    status: string;
    message: string;
    timestamp: number;
  }>;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  // Add type field to determine if order is pharmacy or grocery
  type?: 'pharma' | 'grocery';
  payment?: {
    paymentId: number;
    type: string;
    mode: string;
    amount: string;
    pgName: string;
    pgReferenceId: string;
    pgPaymentId: string | null;
    status: string;
    createdAt: string;
    createdBy: string | null;
    updatedAt: string | null;
    deletedAt: string | null;
    deletedBy: string | null;
    pgKey?: string;
  };
}

class OrderListService {
  private async getAuthToken(): Promise<string> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return token || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  }

  async getOrders(
    filterType?: 'pharma' | 'grocery',
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<OrderListItem[]>> {
    try {
      const token = await this.getAuthToken();
      const headers = {
        'marg-customer-token': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      console.log('📋 Fetching orders...');
      console.log('🔑 Token retrieved:', token ? `${token.substring(0, 20)}...` : 'No token');
      console.log('📋 Filter type:', filterType || 'all');
      console.log('📋 Page:', page, 'Limit:', limit);

      // Build URL with optional filter and pagination
      let url = `https://passkidukaanapi.margerp.com/v1/customer/order?page=${page}&limit=${limit}&orders[createdAt]=desc`;
      if (filterType) {
        url += `&filters[type]=${filterType}`;
      }

      const response = await axios.get(url, {
        headers,
      });

      console.log('   Orders API response:', response.data);

      if (!response.data || !response.data.data) {
        console.log('⚠️ Orders API returned null data, creating mock response');
        return {
          success: true,
          data: [],
        };
      }

      return {
        success: true,
        data: response.data.data as OrderListItem[],
      };
    } catch (error: any) {
      console.error(' Error fetching orders:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch orders',
        data: [],
      };
    }
  }

  async getOrderById(orderId: string): Promise<ApiResponse<any>> {
    try {
      const token = await this.getAuthToken();
      const headers = {
        'marg-customer-token': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const url = `https://passkidukaanapi.margerp.com/v1/customer/order/${orderId}`;
      console.log('📦 Fetching order detail:', url);
      console.log('📦 Order ID:', orderId);
      const response = await axios.get(url, { headers });

      if (!response.data || !response.data.data) {
        return { success: false, error: 'No order found', data: null as any };
      }

      const orderData = response.data.data;
      
      // Log prescription-related fields
      console.log('📦 ===== ORDER DETAILS API RESPONSE =====');
      console.log('📦 Order ID:', orderData.orderId || orderData.id);
      console.log('📦 Order No:', orderData.orderNo);
      console.log('📦 Prescription Fields (Direct):');
      console.log('   - signedPresciptionUrl:', orderData.signedPresciptionUrl || 'NOT PRESENT');
      console.log('   - signedPrescriptionUrl:', orderData.signedPrescriptionUrl || 'NOT PRESENT');
      console.log('   - prescriptionUrl:', orderData.prescriptionUrl || 'NOT PRESENT');
      console.log('📦 Full order data keys:', Object.keys(orderData));
      console.log('📦 Full API Response (stringified):', JSON.stringify(response.data, null, 2));
      console.log('📦 ===== END ORDER DETAILS =====');

      return { success: true, data: orderData };
    } catch (error: any) {
      console.error('❌ Error New', error.response);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch order',
        data: null as any,
      };
    }
  }
}

export default new OrderListService();
