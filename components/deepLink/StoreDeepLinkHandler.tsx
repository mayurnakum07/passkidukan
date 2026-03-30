import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { storeService } from '../../services/api/storeService';

interface StoreDeepLinkHandlerProps {
  children: React.ReactNode;
}

const StoreDeepLinkHandler: React.FC<StoreDeepLinkHandlerProps> = ({ children }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();

  useEffect(() => {
    console.log('🔍 StoreDeepLinkHandler: Route changed:', {
      routeName: route.name,
      routeParams: route.params,
      allRouteData: route
    });
    
    // Check if we're on AboutStore screen with storeId parameter
    if (route.name === 'AboutStore' && route.params) {
      const params = route.params as any;
      console.log('🔍 AboutStore params:', params);
      
      if (params.storeId) {
        console.log('🏪 StoreDeepLinkHandler: Processing store ID:', params.storeId);
        handleStoreDeepLink(params.storeId);
      } else {
        console.log('  No storeId found in params:', params);
      }
    }
  }, [route]);

  const handleStoreDeepLink = async (storeId: string) => {
    try {
      console.log('🔍 Fetching store details for ID:', storeId);
      
      // Fetch store details from backend
      const response = await storeService.getStoreById(storeId);
      
      if (response.success && response.data) {
        console.log(' Store details fetched:', response.data);
        
        // Navigate to AboutStore with full store data
        navigation.setParams({
          store: response.data,
          fromDeepLink: true
        });
        
        // Show success message
        Alert.alert(
          'Store Found!',
          `Opening ${response.data.name}`,
          [{ text: 'OK' }]
        );
      } else {
        console.log('  Store not found or error fetching store details');
        Alert.alert(
          'Store Not Found',
          'The store you\'re looking for could not be found. Please check the link and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Browse Stores', 
              onPress: () => navigation.navigate('StoreList' as any)
            }
          ]
        );
      }
    } catch (error) {
      console.error('  Error handling store deep link:', error);
      Alert.alert(
        'Error',
        'Failed to load the store. Please check your internet connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Browse Stores', 
            onPress: () => navigation.navigate('StoreList' as any)
          }
        ]
      );
    }
  };

  return <>{children}</>;
};

export default StoreDeepLinkHandler;
