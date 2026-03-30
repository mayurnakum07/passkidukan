import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import deepLinkingService from '../../services/deepLinkingService';
import { storeService } from '../../services/api/storeService';
import { useAppContext } from '../../contexts/AppContext';
import { useDeepLinkContext } from '../../contexts/DeepLinkContext';

interface DeepLinkHandlerProps {
  children: React.ReactNode;
}

const DeepLinkHandler: React.FC<DeepLinkHandlerProps> = ({ children }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setSelectedStore, saveLastVisitedStore } = useAppContext();
  const { setIsDeepLinkProcessing, setHasProcessedInitialDeepLink } = useDeepLinkContext();
  const isProcessingRef = useRef(false);

  useEffect(() => {
    console.log('🔗 DeepLinkHandler: Setting up deep link listener');
    
    // Handle initial deep link when app starts
    handleInitialDeepLink();

    // Add direct Linking listener to bypass NavigationContainer
    const directListener = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 DeepLinkHandler: Direct URL listener received:', url);
      handleDeepLink(url);
    });

    // Also add listener for deep links when app is running
    const unsubscribe = deepLinkingService.addDeepLinkListener(handleDeepLink);
    console.log('🔗 DeepLinkHandler: Deep link listener added');

    // Test if listener is working - this should show in console
    console.log('🔗 DeepLinkHandler: Listener setup complete');

    return () => {
      console.log('🔗 DeepLinkHandler: Cleaning up deep link listener');
      directListener?.remove();
      unsubscribe();
    };
  }, []);


  const handleInitialDeepLink = async () => {
    try {
      const initialUrl = await deepLinkingService.getInitialURL();
      if (initialUrl) {
        console.log('🔗 Processing initial deep link:', initialUrl);
        
        // Check if it's actually a deep link we support
        const deepLinkResult = deepLinkingService.parseDeepLink(initialUrl);
        if (deepLinkResult.type !== 'unknown') {
          console.log('🔗 Valid deep link detected, processing...');
          setIsDeepLinkProcessing(true);
          await processDeepLink(initialUrl, true);
          setHasProcessedInitialDeepLink(true);
          setIsDeepLinkProcessing(false);
        } else {
          console.log('🔗 Ignoring unsupported initial URL:', initialUrl);
          setHasProcessedInitialDeepLink(true);
        }
      } else {
        console.log('🔗 No initial deep link found');
        setHasProcessedInitialDeepLink(true);
      }
    } catch (error) {
      console.error('  Error handling initial deep link:', error);
      setHasProcessedInitialDeepLink(true);
      setIsDeepLinkProcessing(false);
    }
  };

  const handleDeepLink = async (url: string) => {
    try {
      console.log('🔗 DeepLinkHandler: Processing deep link:', url);
      await processDeepLink(url);
    } catch (error) {
      console.error('  DeepLinkHandler: Error handling deep link:', error);
    }
  };

  const processDeepLink = async (url: string, isInitial = false) => {
    // Prevent multiple simultaneous deep link processing
    if (isProcessingRef.current) {
      console.log('🔗 Deep link already being processed, ignoring:', url);
      return;
    }

    isProcessingRef.current = true;

    try {
      const deepLinkResult = deepLinkingService.parseDeepLink(url);
      console.log('🔗 Deep link result:', deepLinkResult);

      if (deepLinkResult.type === 'store' && deepLinkResult.params) {
        await handleStoreDeepLink(deepLinkResult.params, isInitial);
      } else if (deepLinkResult.type === 'unknown') {
        console.log('🔗 Unknown deep link type, ignoring:', deepLinkResult.type);
        // Don't show alert for unknown URLs, just log and ignore
      } else {
        console.log('🔗 Unsupported deep link type:', deepLinkResult.type);
        if (!isInitial) {
          Alert.alert(
            'Invalid Link',
            'This link is not supported by the app.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('  Error processing deep link:', error);
      if (!isInitial) {
        Alert.alert(
          'Error',
          'Failed to process the link. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleStoreDeepLink = async (params: { storeId: string; storeType?: 'grocery' | 'pharma'; storeName?: string }, isInitial = false) => {
    try {
      console.log('🏪 Processing store deep link:', params, 'isInitial:', isInitial);

      // First fetch store details to get proper store information
      const storeDetails = await fetchStoreDetails(params.storeId);
      
      if (storeDetails) {
        console.log('✅ Store details fetched, setting store in context:', storeDetails);
        
        // Create store object and set it directly in context
        const newStore = {
          id: params.storeId,
          name: storeDetails.name || params.storeName || 'Selected Store',
          address: storeDetails.address || '',
          type: storeDetails.type || params.storeType || 'grocery',
          pincode: storeDetails.pincode
        };
        
        console.log('🏪 Setting store in context:', newStore);
        setSelectedStore(newStore);
        saveLastVisitedStore(newStore);
        
        // Navigate to HomeScreen - use replace for initial deep links to bypass splash
        if (isInitial) {
          console.log('🏠 Initial deep link - navigating directly to Main');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          console.log('🏠 Deep link while app running - navigating to Main');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      } else {
        console.log('⚠️ Store details not found, using fallback store');
        
        // Create fallback store object and set it directly in context
        const fallbackStore = {
          id: params.storeId,
          name: params.storeName || 'Selected Store',
          address: '',
          type: params.storeType || 'grocery',
          pincode: undefined
        };
        
        console.log('🏪 Setting fallback store in context:', fallbackStore);
        setSelectedStore(fallbackStore);
        saveLastVisitedStore(fallbackStore);
        
        // Navigate to HomeScreen - use replace for initial deep links to bypass splash
        if (isInitial) {
          console.log('🏠 Initial deep link (fallback) - navigating directly to Main');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          console.log('🏠 Deep link while app running (fallback) - navigating to Main');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      }

      console.log('🏠 Navigated to HomeScreen with storeId:', params.storeId);

    } catch (error) {
      console.error('❌ Error handling store deep link:', error);
      if (!isInitial) {
        Alert.alert(
          'Error',
          'Failed to open the store. Please try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Browse Stores', 
              onPress: () => navigation.navigate('StoreList' as any)
            }
          ]
        );
      }
    }
  };

  const fetchStoreDetails = async (storeId: string) => {
    try {
      console.log('🔍 Fetching store details for ID:', storeId);
      
      // Try to get store details from the deep linking service
      const response = await deepLinkingService.fetchStoreDetails(storeId);
      
      if (response.success && response.data) {
        console.log('✅ Store details fetched:', response.data);
        return response.data;
      } else {
        console.log('⚠️ Store not found or error fetching store details:', response.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching store details:', error);
      return null;
    }
  };

  return <>{children}</>;
};

export default DeepLinkHandler;
