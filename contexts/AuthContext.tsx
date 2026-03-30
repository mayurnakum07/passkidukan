import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api/authService';
import { jwtDecode } from 'jwt-decode';
import { onTokenExpired } from '../utils/authEvents';

export type UserPayload = {
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
  iat: number;
  exp: number;
};

interface AuthContextType {
  user: UserPayload | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (mobile: string, otp: string, otpKey: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    mobile: string;
    firstName: string;
    lastName: string;
    email: string;
    otp: string;
  }) => Promise<{ success: boolean; error?: string; data?: any }>;
  logout: () => Promise<void>;
  sendOTP: (mobile: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper to extract user object from API response
function extractUserObject(data: any): any {
  if (data && typeof data === 'object' && 'data' in data && typeof data.data === 'object') {
    return data.data;
  }
  return data;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Load user data from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  // When token is expired/invalid (e.g. API returns 401), show user as logged out. Backend determines expiry; frontend does not set expiry.
  useEffect(() => {
    const unsubscribe = onTokenExpired(() => {
      setUser(null);
      setToken(null);
      clearUserFromStorage();
    });
    return unsubscribe;
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      const token = await AsyncStorage.getItem('auth_token');
      
      console.log('🔄 Loading user from storage...');
      console.log('📱 User data from storage:', userData);
      console.log('🎫 Token from storage:', token);
      
      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        console.log(' Parsed user data:', parsedUser);
        // Extract actual user object if nested
        const actualUserData = extractUserObject(parsedUser);
        console.log(' Actual user data:', actualUserData);
        const userPayload: UserPayload = {
          _id: actualUserData._id || actualUserData.id || '',
          firstName: actualUserData.firstName || '',
          lastName: actualUserData.lastName || '',
          mobile: actualUserData.mobile || '',
          email: actualUserData.email || '',
          mobileVerified: actualUserData.mobileVerified || false,
          emailVerified: actualUserData.emailVerified || false,
          image: actualUserData.image || null,
          customerId: actualUserData.customerId || '',
          lastLoginAt: actualUserData.lastLoginAt || '',
          createdAt: actualUserData.createdAt || '',
          updatedAt: actualUserData.updatedAt || '',
          iat: actualUserData.iat || 0,
          exp: actualUserData.exp || 0,
        };
        setUser(userPayload);
        setToken(token);
        console.log(' User loaded from storage successfully');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('  Error loading user from storage:', error);
      setIsLoading(false);
    }
  };

  const saveUserToStorage = async (userData: UserPayload, token: string) => {
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const clearUserFromStorage = async () => {
    try {
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error clearing user from storage:', error);
    }
  };

  const sendOTP = async (mobile: string): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      const response = await authService.sendOTP(mobile);
      return {
        success: response.success,
        error: response.error,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to send OTP',
      };
    }
  };

  const login = async (mobile: string, otp: string, otpKey: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const response = await authService.verifyOTP(mobile, otp, otpKey);
      
      console.log('🔐 AuthContext login response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        const responseData = response.data as any;
        // Extract token from different possible paths
        let token;
        let userData;
        if (responseData.data?.data?.token) {
          token = responseData.data.data.token;
          userData = responseData.data.data;
        } else if (responseData.data?.token) {
          token = responseData.data.token;
          userData = responseData.data;
        } else if (responseData.token) {
          token = responseData.token;
          userData = responseData;
        }
        console.log('🎫 Extracted token:', token);
        console.log('👤 Extracted user data:', userData);
        if (!token) {
          return { success: false, error: 'No token found in response' };
        }
        // Decode JWT token to get user info
        try {
          const decodedToken = jwtDecode(token) as any;
          console.log('🔓 Decoded token:', decodedToken);
          const userPayload: UserPayload = {
            _id: decodedToken._id,
            firstName: decodedToken.firstName,
            lastName: decodedToken.lastName,
            mobile: decodedToken.mobile,
            email: decodedToken.email,
            mobileVerified: decodedToken.mobileVerified,
            emailVerified: decodedToken.emailVerified,
            image: decodedToken.image,
            customerId: decodedToken.customerId,
            lastLoginAt: decodedToken.lastLoginAt,
            createdAt: decodedToken.createdAt,
            updatedAt: decodedToken.updatedAt,
            iat: decodedToken.iat,
            exp: decodedToken.exp,
          };
          // Save user data and token
          await saveUserToStorage(userPayload, token);
          setUser(userPayload);
          setToken(token);
          // Automatically refresh user data from API to ensure latest info
          console.log('🔄 Auto-refreshing user data after login...');
          try {
            const refreshResponse = await authService.getProfile();
            if (refreshResponse.success && refreshResponse.data) {
              // Extract actual user object if nested
              const refreshedUser = extractUserObject(refreshResponse.data);
              setUser(refreshedUser as UserPayload);
              await AsyncStorage.setItem('user_data', JSON.stringify(refreshedUser));
              console.log(' User data refreshed after login:', refreshedUser);
            }
          } catch (refreshError) {
            console.log('⚠️ Could not refresh user data, using token data:', refreshError);
          }
          console.log(' User logged in successfully');
          return { success: true };
        } catch (decodeError) {
          console.error('  Error decoding token:', decodeError);
          return { success: false, error: 'Invalid token format' };
        }
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    mobile: string;
    firstName: string;
    lastName: string;
    email: string;
    otp: string;
  }): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      const response = await authService.registerUser(userData);
      
      if (response.success && response.data) {
        // Don't set user yet, wait for OTP verification
        return { success: true, data: response.data };
      } else {
        return {
          success: false,
          error: response.error || 'Registration failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Registration failed',
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      setToken(null);
      await clearUserFromStorage();
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      console.log('🔄 Refreshing user data...');
      const response = await authService.getProfile();
      if (response.success && response.data) {
        // Extract actual user object if nested
        const actualUser = extractUserObject(response.data);
        console.log(' User data refreshed:', actualUser);
        setUser(actualUser as UserPayload);
        await AsyncStorage.setItem('user_data', JSON.stringify(actualUser));
      } else {
        console.log('  Failed to refresh user data:', response.error);
        await logout();
      }
    } catch (error) {
      console.error('💥 Error refreshing user:', error);
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    sendOTP,
    refreshUser,
  };

  // Debug logging
  console.log('🔍 AuthContext State:', {
    user: user ? `${user.firstName} ${user.lastName}` : 'null',
    isAuthenticated,
    isLoading,
    hasToken: !!token
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};