import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BackHandler, Platform, Alert } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import { RootStackParamList } from './types';
import SplashScreen from '../screens/auth/SplashScreen';
import PincodeScreen from '../screens/location/PincodeScreen';
import StoreListScreen from '../screens/store/StoreListScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/cart/PaymentMethodsScreen';
import OrderConfirmationScreen from '../screens/order/OrderConfirmationScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import OrdersScreen from '../screens/order/OrdersScreen';
import OrderDetailScreen from '../screens/order/OrderDetailScreen';
import PaymentMethodsScreen from '../screens/cart/PaymentMethodsScreen';
import RazorpayCheckoutScreen from '../screens/payment/RazorpayCheckoutScreen';
import HelpCenterScreen from '../screens/help/HelpCenterScreen';
import AllProductsScreen from '../screens/product/AllProductsScreen';
import BannerDetailScreen from '../screens/home/BannerDetailScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import BottomTabNavigator from './BottomTabNavigator';
import ProductDetailScreen from '../screens/product/ProductDetailScreen';
import MedicineDetailScreen from '../screens/product/MedicineDetailScreen';
import CategoryDetailScreen from '../screens/category/CategoryDetailScreen';
import CategoriesScreen from '../screens/category/CategoriesScreen';
import BrandsScreen from '../screens/category/BrandsScreen';
import RecentlyBoughtScreen from '../screens/profile/RecentlyBoughtScreen';
import GreatOffersScreen from '../screens/home/GreatOffersScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import MyAddressesScreen from '../screens/profile/MyAddressesScreen';
import AddAddressScreen from '../screens/profile/AddAddressScreen';
import LocationPickerScreen from '../screens/location/LocationPickerScreen';
import MyWishlistScreen from '../screens/profile/MyWishlistScreen';
import AboutStoreScreen from '../screens/store/AboutStoreScreen';
import ContactStoreScreen from '../screens/store/ContactStoreScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import GroceryHomeScreen from '../screens/home/GroceryHomeScreen';
import PharmacyHomeScreen from '../screens/home/PharmacyHomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import SavedProductsScreen from '../screens/profile/SavedProductsScreen';
import Under99ProductsScreen from '../screens/product/Under99ProductsScreen';
import Under199ProductsScreen from '../screens/product/Under199ProductsScreen';
import SearchResultsScreen from '../screens/search/SearchResultsScreen';
import BrandDetailScreen from '../screens/category/BrandDetailScreen';
import UploadPrescriptionScreen from '../screens/prescription/UploadPrescriptionScreen';
import OrderSelectionScreen from '../screens/prescription/OrderSelectionScreen';
import ImageViewerScreen from '../screens/common/ImageViewerScreen';
import InvoicePreviewScreen from '../screens/order/InvoicePreviewScreen';
import OrderSummaryScreen from '../screens/order/OrderSummaryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  // Handle back button to exit app when on home/main screen
  const navigationState = useNavigationState(state => state);
  
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Get the current route and check nested routes
      const getCurrentRouteName = (navState: any): string | null => {
        if (!navState || !navState.routes || navState.routes.length === 0) return null;
        const route = navState.routes[navState.index ?? navState.routes.length - 1];
        
        // Check if route has nested state (like Main -> Home)
        if (route.state && route.state.routes) {
          const nestedRoute = route.state.routes[route.state.index ?? route.state.routes.length - 1];
          // Check if nested route has further nesting (like Home -> HomeRoot)
          if (nestedRoute.state && nestedRoute.state.routes) {
            const deepRoute = nestedRoute.state.routes[nestedRoute.state.index ?? nestedRoute.state.routes.length - 1];
            return deepRoute.name;
          }
          return nestedRoute.name;
        }
        return route.name;
      };
      
      const currentRouteName = getCurrentRouteName(navigationState);
      
      // If we're on Main/Home screen, show exit confirmation
      if (currentRouteName === 'Main' || currentRouteName === 'Home' || currentRouteName === 'HomeRoot') {
        Alert.alert(
          'Exit App',
          'Do you want to exit the app?',
          [
            { text: 'No', style: 'cancel', onPress: () => {} },
            { text: 'Yes', onPress: () => { if (Platform.OS === 'android') BackHandler.exitApp(); } },
          ],
          { cancelable: true }
        );
        return true; // Prevent default back action
      }
      
      // Otherwise, let navigation handle it
      return false;
    });

    return () => backHandler.remove();
  }, [navigationState]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Pincode" component={PincodeScreen} />
      <Stack.Screen name="StoreList" component={StoreListScreen} />
      <Stack.Screen name="Main" component={BottomTabNavigator} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} />
      <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="RazorpayCheckout" component={RazorpayCheckoutScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="AllProducts" component={AllProductsScreen} />
      <Stack.Screen name="BannerDetail" component={BannerDetailScreen} />
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="CategoriesScreen" component={CategoriesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BrandsScreen" component={BrandsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BrandDetail" component={BrandDetailScreen} />
      {/* <Stack.Screen name="RecentlyBoughtScreen" component={RecentlyBoughtScreen} options={{ headerShown: false }} /> */}
      {/* <Stack.Screen name="GreatOffersScreen" component={GreatOffersScreen} options={{ headerShown: false }} /> */}
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MyAddresses" component={MyAddressesScreen} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />
      <Stack.Screen name="MyWishlist" component={MyWishlistScreen} />
      <Stack.Screen name="AboutStore" component={AboutStoreScreen} />
      <Stack.Screen name="ContactStore" component={ContactStoreScreen} />
      <Stack.Screen name="GroceryHome" component={GroceryHomeScreen} />
      <Stack.Screen name="PharmacyHome" component={PharmacyHomeScreen} />
      <Stack.Screen name="LocateStore" component={AboutStoreScreen} />
      <Stack.Screen name="AboutPassKiDukaan" component={AboutStoreScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={AboutStoreScreen} />
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="SavedProducts" component={SavedProductsScreen} />
      <Stack.Screen name="Under99Products" component={Under99ProductsScreen} />
      <Stack.Screen name="Under199Products" component={Under199ProductsScreen} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
      <Stack.Screen name="OrderSelection" component={OrderSelectionScreen} />
      <Stack.Screen name="UploadPrescription" component={UploadPrescriptionScreen} />
      <Stack.Screen name="ImageViewer" component={ImageViewerScreen} />
      <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} />
      <Stack.Screen name="InvoicePreview" component={InvoicePreviewScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator; 