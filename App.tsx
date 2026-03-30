import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinkingOptions, NavigationContainer, useNavigation, useNavigationState } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeBaseProvider } from 'native-base';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import DeepLinkHandler from './components/deepLink/DeepLinkHandler';
import CustomToast from './components/ui/CustomToast';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { initializeMargBannerService } from './config/margBannerConfig';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { DeepLinkProvider } from './contexts/DeepLinkContext';
import { StorageProvider } from './contexts/StorageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { WishlistProvider } from './contexts/WishlistContext';
import AppNavigator from './navigation/AppNavigator';
import { RootStackParamList } from './navigation/types';

const getDeepestRouteName = (navState: any) => {
  if (!navState || !navState.routes || navState.routes.length === 0) return null;
  let route = navState.routes[navState.index ?? navState.routes.length - 1];
  while (route.state && route.state.routes) {
    route = route.state.routes[route.state.index ?? route.state.routes.length - 1];
  }
  return route.name;
};

const FloatingCartButton = () => {
  const { totalItems } = useCart();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  // Get current route name (deepest focused route)
  const navState = useNavigationState(state => state);
  const currentRoute = getDeepestRouteName(navState);

  // Hide on specific screens or if cart is empty
  const homeRouteNames = ['Home', 'HomeScreen', 'HomeRoot'];
  if (
    totalItems === 0 ||
    [
      'Splash',
      'Pincode',
      'StoreList',
      'SearchScreen',
      'Profile',
      'EditProfile',
      'MyAddresses',
      'AddAddress',
      'Settings',
      'MyWishlist',
      'RecentlyBought',
      'SavedProducts',
      'Home',
      'HomeScreen',
      'HomeRoot',
    ].includes(currentRoute)
  ) return null;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Cart')}
      style={{
        position: 'absolute',
        top: (insets.top || 16) + 8,
        right: 16,
        minWidth: 44,
        height: 44,
        backgroundColor: '#1A7B50',
        borderRadius: 22,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      }}
    >
      <MaterialCommunityIcons name="cart" size={20} color="#fff" />
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, marginLeft: 6 }}>{totalItems}</Text>
    </TouchableOpacity>
  );
};

const AppContent = () => {
  const { theme } = useTheme();
  
  // Initialize MargERP Banner Service on app startup
  React.useEffect(() => {
    initializeMargBannerService();
  }, []);
  
  const linking = React.useMemo<LinkingOptions<RootStackParamList>>(() => ({
    prefixes: [
      'paaskidukaan://',
      'ecomm://',
      'https://stores.yourdomain.com',
      'https://qr.ecomm.com',
      'https://ecomm-stores.com',
      'https://passkidukaanapi.margerp.com'
    ],
    config: {
      screens: {
        Splash: 'splash',
        Pincode: 'pincode',
        StoreList: 'store-list',
        AboutStore: {
          path: 'store/:storeId',
          parse: {
            storeId: (storeId: string) => storeId,
          },
        },
      },
    },
    // Let DeepLinkHandler handle all deep links
    getStateFromPath: (path, options) => {
      console.log('🔗 NavigationContainer: getStateFromPath called with:', path);
      console.log('🔗 NavigationContainer: Letting DeepLinkHandler handle deep links');
      
      // Don't handle store deep links here - let DeepLinkHandler handle them
      // This ensures DeepLinkHandler gets the URL event and can process it properly
      return undefined;
    },
  }), []);
  return (
      <NavigationContainer theme={theme} linking={linking}>
        <NativeBaseProvider>
            <AppProvider>
            <StorageProvider>
              <WishlistProvider>
              <CartProvider>
                <ToastProvider>
                  <DeepLinkProvider>
                    <ErrorBoundary>
                      <DeepLinkHandler>
                        <AppNavigator />
                        {/* <FloatingCartButton /> */}
                      </DeepLinkHandler>
                    </ErrorBoundary>
                  </DeepLinkProvider>
                  <CustomToast />
                </ToastProvider>
              </CartProvider>
              </WishlistProvider>
            </StorageProvider>
          </AppProvider>
        </NativeBaseProvider>
      </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StorageProvider> 
          <ThemeProvider> 
            <AppContent />
          </ThemeProvider>
        </StorageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
