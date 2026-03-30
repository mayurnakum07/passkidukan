import { apiClient } from './client';
import { ApiResponse } from './types';

export interface Address {
  _id?: string;
  customerAddressId?: string;
  label: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressRequest {
  label: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

class AddressService {
  // Get all addresses for the authenticated user
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    try {
      console.log('📡 Fetching addresses from /v1/customer/address...');
      const response = await apiClient.get<Address[]>('/v1/customer/address');
      console.log(' Get addresses response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.log('  Get addresses error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: 'Failed to fetch addresses. Please try again.', 
        data: null as any 
      };
    }
  }

  // Create a new address
  async createAddress(addressData: CreateAddressRequest): Promise<ApiResponse<Address>> {
    try {
      console.log('📡 Creating address with data:', JSON.stringify(addressData, null, 2));
      const response = await apiClient.post<Address>('/v1/customer/address', addressData);
      console.log(' Create address response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.log('  Create address error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: 'Failed to create address. Please try again.', 
        data: null as any 
      };
    }
  }

  // Get a single address by ID
  async getAddressById(addressId: string): Promise<ApiResponse<Address>> {
    try {
      console.log('📡 Fetching address by ID:', addressId);
      const response = await apiClient.get<Address>(`/v1/customer/address/${addressId}`);
      console.log(' Get address by ID response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.log('  Get address by ID error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: 'Failed to fetch address. Please try again.', 
        data: null as any 
      };
    }
  }

  // Update an existing address
  async updateAddress(addressId: string, addressData: Partial<CreateAddressRequest>): Promise<ApiResponse<Address>> {
    try {
      console.log('📡 Updating address:', addressId, 'with data:', JSON.stringify(addressData, null, 2));
      const response = await apiClient.patch<Address>(`/v1/customer/address/${addressId}`, addressData);
      console.log(' Update address response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.log('  Update address error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: 'Failed to update address. Please try again.', 
        data: null as any 
      };
    }
  }

  // Delete an address
  async deleteAddress(addressId: string): Promise<ApiResponse<boolean>> {
    try {
      console.log('📡 Deleting address:', addressId);
      const response = await apiClient.delete<boolean>(`/v1/customer/address/${addressId}`);
      console.log(' Delete address response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.log('  Delete address error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: 'Failed to delete address. Please try again.', 
        data: null as any 
      };
    }
  }

  // Set an address as default
  async setDefaultAddress(addressId: string): Promise<ApiResponse<Address>> {
    try {
      console.log('📡 Setting address as default:', addressId);
      const response = await apiClient.patch<Address>(`/v1/customer/address/${addressId}/default`, {});
      console.log(' Set default address response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.log('  Set default address error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: 'Failed to set default address. Please try again.', 
        data: null as any 
      };
    }
  }
}

export const addressService = new AddressService(); 