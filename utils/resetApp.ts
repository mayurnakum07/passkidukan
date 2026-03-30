// utils/resetApp.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Comprehensive app reset utility
 * Clears all AsyncStorage data and resets all app contexts
 */
export const resetApp = async (): Promise<void> => {
  try {
    console.log('🔄 Starting comprehensive app reset...');
    
    // List of all possible AsyncStorage keys that might exist
    const keysToRemove = [
      // Cart related
      'groceryCart',
      'pharmacyCart', 
      'grocery_cart',
      'pharmacy_cart',
      
      // Store related
      'selectedStore',
      'last_visited_store',
      'store_data',
      
      // User related
      'user_data',
      'auth_token',
      'user',
      
      // App state
      'cart',
      'appSection',
      'location_data',
      'userLocation',
      
      // Preferences and settings
      'preferences',
      'settings',
      'theme_preferences',
      
      // Temporary data
      'temp_data',
      'cache_data',
      'session_data',
      'temp_cart',
      'temp_user',
      
      // Order related
      'pending_orders',
      'order_history',
      'payment_data',
      
      // Address related
      'user_addresses',
      'default_address',
      'selected_address',
      
      // Any other keys that might exist
      'app_state',
      'navigation_state',
      'last_sync',
      'offline_data'
    ];
    
    console.log('🧹 Removing specific AsyncStorage keys...');
    
    // Remove specific keys first
    for (const key of keysToRemove) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(` Removed key: ${key}`);
      } catch (error) {
        console.log(`⚠️ Could not remove key ${key}:`, error);
      }
    }
    
    // Nuclear option: Clear all AsyncStorage
    try {
      await AsyncStorage.clear();
      console.log(' Cleared all AsyncStorage completely');
    } catch (error) {
      console.log('⚠️ Could not clear all AsyncStorage:', error);
    }
    
    console.log('🎉 App reset complete - all data cleared');
    
    // You might want to restart the app here
    // For React Native, you could use:
    // import { BackHandler } from 'react-native';
    // BackHandler.exitApp();
    
  } catch (error) {
    console.error('  Error during app reset:', error);
    throw error;
  }
};

/**
 * Reset only cart-related data
 */
export const resetCart = async (): Promise<void> => {
  try {
    console.log('🧹 Resetting cart data...');
    
    const cartKeys = [
      'groceryCart',
      'pharmacyCart',
      'grocery_cart', 
      'pharmacy_cart',
      'temp_cart'
    ];
    
    for (const key of cartKeys) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(` Removed cart key: ${key}`);
      } catch (error) {
        console.log(`⚠️ Could not remove cart key ${key}:`, error);
      }
    }
    
    console.log(' Cart data reset complete');
  } catch (error) {
    console.error('  Error resetting cart:', error);
    throw error;
  }
};

/**
 * Reset user-related data (logout equivalent)
 */
export const resetUser = async (): Promise<void> => {
  try {
    console.log('🧹 Resetting user data...');
    
    const userKeys = [
      'user_data',
      'auth_token',
      'user',
      'user_addresses',
      'default_address',
      'selected_address'
    ];
    
    for (const key of userKeys) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(` Removed user key: ${key}`);
      } catch (error) {
        console.log(`⚠️ Could not remove user key ${key}:`, error);
      }
    }
    
    console.log(' User data reset complete');
  } catch (error) {
    console.error('  Error resetting user data:', error);
    throw error;
  }
};
