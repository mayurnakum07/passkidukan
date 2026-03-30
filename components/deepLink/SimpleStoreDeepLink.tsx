import React, { useEffect } from 'react';
import { Linking } from 'react-native';

const SimpleStoreDeepLink: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    console.log('🔗 SimpleStoreDeepLink: Setting up listener');

    // Add listener for deep links - NavigationContainer will handle the routing
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 Linking.addEventListener triggered with URL:', url);
      
      // Skip if it's a development URL
      if (url.startsWith('exp://') || url.startsWith('http://') || url.startsWith('https://localhost')) {
        console.log('🔗 Skipping development URL in listener:', url);
        return;
      }
      
      console.log('🔗 Deep link will be handled by NavigationContainer:', url);
    });

    return () => {
      console.log('🔗 Cleaning up deep link listener');
      subscription?.remove();
    };
  }, []);

  return <>{children}</>;
};

export default SimpleStoreDeepLink;