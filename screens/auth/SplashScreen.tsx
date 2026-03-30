import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';
import { useDeepLinkContext } from '../../contexts/DeepLinkContext';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const { lastVisitedStore, selectedStore } = useAppContext();
  const { isDeepLinkProcessing, hasProcessedInitialDeepLink } = useDeepLinkContext();
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { colors } = theme;

  
  // Animation values
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      // Scale animation
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      // Fade animation
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Rotate animation (subtle)
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigation timer - wait for auth to load and deep link processing
    const timer = setTimeout(() => {
      try {
        // Check if we're processing a deep link
        if (isDeepLinkProcessing) {
          console.log('🔗 Deep link is being processed, waiting...');
          return;
        }

        // Check if deep link processing is complete and we have a selected store
        if (hasProcessedInitialDeepLink && selectedStore) {
          console.log('🔗 Deep link processed with store selected, navigating to Main');
          navigation.replace('Main', undefined as any);
          return;
        }

        if (!isLoading) {
          if (isAuthenticated) {
            // User is logged in, check if they have a last visited store
            if (lastVisitedStore) {
              // User has a saved store, navigate directly to main tabs
              console.log('🔄 User is authenticated with saved store, navigating to main tabs');
              navigation.replace('Main', undefined as any);
            } else {
              // User is logged in but no saved store, navigate to pincode
              console.log('🔄 User is authenticated but no saved store, navigating to pincode');
              navigation.replace('Pincode');
            }
          } else {
            // User is not logged in, navigate to pincode screen
            navigation.replace('Pincode');
          }
        }
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        navigation.replace('Pincode');
      }
    }, 2000); // Reduced time for faster navigation
    
    return () => clearTimeout(timer);
  }, [navigation, isAuthenticated, isLoading, lastVisitedStore, isDeepLinkProcessing, hasProcessedInitialDeepLink, selectedStore]);

  const rotateInterpolate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'], // Subtle rotation
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background, // Fallback background
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <Image
        source={require('../../assets/splash.png')}
        style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
      />
    </View>
  );
};

export default SplashScreen;