// services/api/client.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import { ApiResponse, ApiError } from './types';
import { isSSLError } from '../../utils/networkSecurity';
import { emitTokenExpired } from '../../utils/authEvents';

// API Configuration
const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://passkidukaanapi.margerp.com',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// HTTP Methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request Options
interface RequestOptions {
  method: HttpMethod;
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean;
}

// Response wrapper
interface ApiClientResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.retryAttempts = API_CONFIG.retryAttempts;
    this.retryDelay = API_CONFIG.retryDelay;
  }

  // Get auth token from storage
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Set auth token in storage
  private async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  // Clear auth token from storage
  private async clearAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  // Build URL with query parameters
  private buildURL(url: string, params?: Record<string, any>): string {
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    if (!params) return fullURL;

    const urlObj = new URL(fullURL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });

    return urlObj.toString();
  }

  // Get default headers
  private async getDefaultHeaders(): Promise<Record<string, string>> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      // API expects marg-customer-token header instead of Authorization
      headers['marg-customer-token'] = token;
      console.log('🔑 Adding token to headers:', token);
    }

    return headers;
  }

  // Handle API errors
  private handleApiError(error: any): ApiError {
    console.error('🔴 handleApiError called with:', JSON.stringify(error, null, 2));
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      console.error('   Server responded with error status:', status);
      return {
        code: data?.code || `HTTP_${status}`,
        message: data?.message || `HTTP Error ${status}`,
        details: data?.details || { status, data },
      };
    } else if (error.request) {
      // Network error - request was made but no response received
      console.error('   Network error - request made but no response');
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      
      // Check for SSL errors first
      const sslError = isSSLError(error);
      
      // Provide more specific error messages based on error code
      let errorMessage = 'Network error occurred. Please check your connection.';
      
      if (sslError.isSSLError) {
        errorMessage = 'SSL certificate validation failed. Please ensure the app has been rebuilt with the latest network security configuration.';
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Request timeout. The server took too long to respond.';
      } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        errorMessage = 'DNS lookup failed. Please check your internet connection.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused. The server may be down or unreachable.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network request failed. Please check your internet connection.';
      }
      
      return {
        code: 'NETWORK_ERROR',
        message: errorMessage,
        details: { 
          request: error.request,
          code: error.code,
          message: error.message,
          config: error.config,
        },
      };
    } else {
      // Other error
      console.error('   Unknown error type');
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
        details: { error },
      };
    }
  }

  // Retry mechanism
  private async retryRequest<T>(
    requestFn: () => Promise<ApiClientResponse<T>>,
    attempt: number = 1
  ): Promise<ApiClientResponse<T>> {
    try {
      return await requestFn();
    } catch (error: any) {
      console.error(`🔄 Retry Attempt ${attempt}/${this.retryAttempts}:`);
      console.error('   Error:', error.message || error);
      console.error('   Error Code:', error.code);
      console.error('   Should Retry:', attempt < this.retryAttempts && this.shouldRetry(error));
      
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        const delayTime = this.retryDelay * attempt;
        console.log(`   Retrying after ${delayTime}ms...`);
        await this.delay(delayTime);
        return this.retryRequest(requestFn, attempt + 1);
      }
      console.error('   Max retries reached or error not retryable. Throwing error.');
      throw error;
    }
  }

  // Check if request should be retried
  private shouldRetry(error: any): boolean {
    if (error.response) {
      const status = error.response.status;
      // Retry on 5xx server errors and 429 (rate limit)
      return status >= 500 || status === 429;
    }
    // Retry on network errors
    return !error.response && error.request;
  }

  // Delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Main request method
  async request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    const {
      method,
      url,
      data,
      params,
      headers: customHeaders,
      timeout = this.timeout,
      retry = true,
    } = options;

    const requestFn = async (): Promise<ApiClientResponse<T>> => {
      const fullURL = this.buildURL(url, params);
      const defaultHeaders = await this.getDefaultHeaders();
      const requestHeaders = { ...defaultHeaders, ...customHeaders };

      console.log('  API Request:', {
        method,
        url: fullURL,
        headers: requestHeaders,
        data: data
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response: AxiosResponse = await axios({
          method,
          url: fullURL,
          headers: requestHeaders,
          data: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
          timeout,
        });

        clearTimeout(timeoutId);

        console.log('📡 API Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });

        // Handle HTTP errors
        if (response.status >= 400) {
          console.log('  API Error Response:', response.data);
          throw {
            response: {
              status: response.status,
              data: response.data,
            },
          };
        }

        // Handle successful response
        const responseData = response.data;
        console.log(' API Success Response:', responseData);
        
        // Handle token refresh if needed
        if (response.headers['x-new-token']) {
          await this.setAuthToken(response.headers['x-new-token']);
        }

        return {
          data: responseData,
          status: response.status,
          headers: Object.fromEntries(
            Object.entries(response.headers).map(([k, v]) => [k, String(v)])
          ),
        };
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        // Check for SSL certificate errors
        const sslError = isSSLError(error);
        
        // Detailed error logging
        console.error('🔴 Axios Error Caught in apiClient:');
        console.error('   Error Name:', error.name);
        console.error('   Error Message:', error.message);
        console.error('   Error Code:', error.code);
        console.error('   Has Response:', !!error.response);
        console.error('   Has Request:', !!error.request);
        
        if (sslError.isSSLError) {
          console.error('');
          console.error('🔴 SSL CERTIFICATE ERROR DETECTED!');
          console.error('   URL:', fullURL);
          console.error('   Error:', sslError.message);
          console.error('   Code:', sslError.code);
          console.error('');
          console.error('💡 Solutions:');
          console.error('   1. Network security config has been configured');
          console.error('   2. Rebuild the Android app: npx expo run:android');
          console.error('   3. Ensure API certificate is valid');
          console.error('   4. Check network_security_config.xml is present');
          console.error('');
        }
        
        if (error.response) {
          console.error('   Response Status:', error.response.status);
          console.error('   Response Status Text:', error.response.statusText);
          console.error('   Response Data:', JSON.stringify(error.response.data, null, 2));
          console.error('   Response Headers:', JSON.stringify(error.response.headers, null, 2));
        }
        
        if (error.request) {
          console.error('   Request Made:', true);
          console.error('   Request Details:', JSON.stringify({
            method: error.config?.method,
            url: error.config?.url,
            timeout: error.config?.timeout,
          }, null, 2));
          
          // Enhanced SSL error detection for Android
          if (Platform.OS === 'android') {
            const requestError = error.request._response || error.message || '';
            if (requestError.includes('CertPathValidatorException') ||
                requestError.includes('SSLException') ||
                requestError.includes('javax.net.ssl')) {
              console.error('');
              console.error('   ⚠️ Android SSL Certificate Error:');
              console.error('   This indicates the certificate chain is not trusted.');
              console.error('   The network_security_config.xml should handle this.');
              console.error('   Please rebuild the app after network config changes.');
              console.error('');
            }
          }
        }
        
        console.error('   Full Error Object:', JSON.stringify(error, null, 2));
        
        // Handle abort error (timeout)
        if (error.name === 'AbortError') {
          throw {
            code: 'TIMEOUT_ERROR',
            message: 'Request timeout',
            details: { timeout },
          };
        }
        
        // Enhance SSL error message
        if (sslError.isSSLError) {
          error.sslError = true;
          error.sslMessage = 'SSL certificate validation failed. Please ensure the app has been rebuilt with the latest network security configuration.';
        }
        
        throw error;
      }
    };

    try {
      const response = retry 
        ? await this.retryRequest(requestFn)
        : await requestFn();

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // Log the actual error before processing
      console.error('🔴 Error in apiClient.request before handleApiError:');
      console.error('   Error Type:', typeof error);
      console.error('   Error:', JSON.stringify(error, null, 2));
      
      const apiError = this.handleApiError(error);
      
      // Log the processed error
      console.error('🔴 Processed API Error:');
      console.error('   Error Code:', apiError.code);
      console.error('   Error Message:', apiError.message);
      console.error('   Error Details:', JSON.stringify(apiError.details, null, 2));
      
      // When backend returns 401 (token expired/invalid), clear auth and notify app. Frontend does not set token expiry; backend determines it.
      const is401 = apiError.code === 'UNAUTHORIZED' || apiError.code === 'TOKEN_EXPIRED' || apiError.code === 'HTTP_401';
      if (is401) {
        await this.clearAuthToken();
        try { await AsyncStorage.removeItem('user_data'); } catch (_) {}
        emitTokenExpired();
      }

      return {
        success: false,
        error: apiError.message,
        data: null as any,
      };
    }
  }

  // Convenience methods
  async get<T>(url: string, params?: Record<string, any>, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
      ...options,
    });
  }

  async post<T>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...options,
    });
  }

  async put<T>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...options,
    });
  }

  async patch<T>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      ...options,
    });
  }

  async delete<T>(url: string, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...options,
    });
  }

  // Upload file method
  async uploadFile<T>(
    url: string,
    file: { uri: string; type: string; name: string },
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers,
    });
  }

  // Download file method
  async downloadFile(url: string, filename?: string): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // For React Native, you might want to use react-native-fs or expo-file-system
      // This is a placeholder implementation
      return {
        success: true,
        filePath: filename || 'downloaded_file',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export for convenience
export default apiClient;