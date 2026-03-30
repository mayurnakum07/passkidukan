// services/api/authService.ts
import apiClient from './client';
import { ApiResponse, AuthResponse, LoginRequest, SendOTPRequest, User, UserProfile } from './types';

export class AuthService {
  async sendOTP(mobile: string): Promise<ApiResponse<{ message: string; otpKey?: string }>> {
    const request = { mobile };
    
    try {
      console.log('📤 Sending OTP Request with:', request);
      const response = await apiClient.post<any>('/v1/customer/login', request);
      console.log(' OTP API Response:', JSON.stringify(response, null, 2));
      
      // Handle nested response structure
      if (response.success && response.data) {
        // Check if response.data has nested data structure
        const actualData = response.data.data || response.data;
        const otpKey = actualData?.otpKey;
        
        return {
          success: true,
          data: {
            message: 'OTP sent successfully',
            otpKey: otpKey
          }
        };
      }
      
      return response;
    } catch (error: any) {
      console.log('  OTP API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to send OTP. Please check your mobile number.',
        data: null as any,
      };
    }
  }

  async verifyOTP(mobile: string, otp: string, otpKey: string): Promise<ApiResponse<AuthResponse>> {
    const request = { otpKey, otp };

    try {
      console.log('📤 Verifying OTP with:', request);
      const response = await apiClient.post<any>('/v1/customer/verify-otp', request);
      console.log(' Verify OTP Response:', JSON.stringify(response, null, 2));
      
      // Handle the actual API response structure
      if (response.success && response.data) {
        // The actual API returns: { status: "success", data: { token: "..." } }
        const apiData = response.data;
        
        if (apiData.status === 'success' && apiData.data?.token) {
          return {
            success: true,
            data: {
              success: true,
              data: {
                status: 'success',
                token: apiData.data.token,
                // Extract user info from JWT token if needed
                ...apiData.data
              }
            }
          };
        } else {
          return {
            success: false,
            error: 'Invalid response format from server',
            data: null as any,
          };
        }
      }
      
      return response;
    } catch (error: any) {
      console.log('  Verify OTP Error:', error.response?.data || error.message);
      
      // Extract error message from API response
      let errorMessage = 'Failed to verify OTP. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        data: null as any,
      };
    }
  }

  async registerUser(userData: {
    mobile: string;
    firstName: string;
    lastName: string;
    email: string;
    otp?: string;
  }): Promise<ApiResponse<{ message: string; otpKey?: string }>> {
    const request = {
      mobile: userData.mobile,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      ...(userData.otp && { otp: userData.otp })
    };

    try {
      console.log('📤 Registering user with:', request);
      const response = await apiClient.post<any>('/v1/customer/register', request);
      console.log(' Register Response:', JSON.stringify(response, null, 2));
      
      // Handle nested response structure
      if (response.success && response.data) {
        // Check if response.data has nested data structure
        const actualData = response.data.data || response.data;
        const otpKey = actualData?.otpKey;
        
        return {
          success: true,
          data: {
            message: 'User registered successfully',
            otpKey: otpKey
          }
        };
      }
      
      return response;
    } catch (error: any) {
      console.log('  Register Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to register user. Please try again.',
        data: null as any,
      };
    }
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>('/v1/customer/self');
  }

  async updateProfile(profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return apiClient.put<UserProfile>('/v1/customer/self', profileData);
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/v1/customer/logout');
  }

  async refreshToken(): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    return apiClient.post<{ token: string; refreshToken: string }>('/v1/customer/refresh');
  }

  async checkPhoneExists(mobile: string): Promise<ApiResponse<{ exists: boolean }>> {
    try {
      const response = await this.sendOTP(mobile);
      return {
        success: true,
        data: { exists: response.success },
      };
    } catch (error: any) {
      console.log('  Check phone exists error:', error.response?.data || error.message);
      return {
        success: false,
        data: { exists: false },
        error: 'Failed to check mobile number',
      };
    }
  }
}

export const authService = new AuthService();
export default authService; 
