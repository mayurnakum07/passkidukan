// services/api/customerService.ts
import axios from 'axios';
import { ApiResponse } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomerUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  // Note: mobile is not allowed to be updated as per API documentation
}

export interface CustomerData {
  _id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  mobileVerified: boolean;
  emailVerified: boolean;
  image: string | null;
  customerId: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

class CustomerService {
  private async getAuthToken(): Promise<string> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No auth token found');
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  }

  async updateCustomerSelf(updateData: CustomerUpdateRequest): Promise<ApiResponse<CustomerData>> {
    try {
      const token = await this.getAuthToken();
      const headers = {
        'marg-customer-token': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      console.log('👤 Updating customer profile:', updateData);
      console.log('🔑 Token retrieved:', token ? `${token.substring(0, 20)}...` : 'No token');

      const response = await axios.patch('https://passkidukaanapi.margerp.com/v1/customer/self', updateData, {
        headers,
      });

      console.log('👤 Customer profile update response:', response.data);

      if (!response.data || response.data.status !== 'success') {
        return {
          success: false,
          error: 'Failed to update customer profile',
          data: null as any,
        };
      }

      return {
        success: true,
        data: response.data.data as CustomerData,
      };
    } catch (error: any) {
      console.error('❌ Error updating customer profile:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update customer profile',
        data: null as any,
      };
    }
  }

  async getCustomerSelf(): Promise<ApiResponse<CustomerData>> {
    try {
      const token = await this.getAuthToken();
      const headers = {
        'marg-customer-token': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      console.log('👤 Fetching customer profile...');
      console.log('🔑 Token retrieved:', token ? `${token.substring(0, 20)}...` : 'No token');

      const response = await axios.get('https://passkidukaanapi.margerp.com/v1/customer/self', {
        headers,
      });

      console.log('👤 Customer profile fetch response:', response.data);

      if (!response.data || response.data.status !== 'success') {
        return {
          success: false,
          error: 'Failed to fetch customer profile',
          data: null as any,
        };
      }

      return {
        success: true,
        data: response.data.data as CustomerData,
      };
    } catch (error: any) {
      console.error('❌ Error fetching customer profile:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch customer profile',
        data: null as any,
      };
    }
  }
}

export default new CustomerService();
