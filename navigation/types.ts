import { NavigatorScreenParams } from '@react-navigation/native';

// navigation/types.ts
export type RootStackParamList = {
  Splash: undefined;
  Pincode: undefined;
  StoreSelection: undefined;
  StoreList: {
    pincode?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    storeType?: 'grocery' | 'pharma';
  };
  Main: NavigatorScreenParams<HomeTabParamList>;
  ProductDetail: { product: any };
  CategoryDetail: { category: any & { selectedSubcategoryId?: string } };
  MedicineDetail: { medicine: any };
  Cart: undefined;
  Checkout: { type: 'grocery' | 'pharma' };
  OrderConfirmation: {
    paymentData?: any;
    orderId?: string;
    orderNo?: string;
    amount?: number;
    storeId?: string;
    storeName?: string;
    fromPrescriptionFlow?: boolean;
    orderData?: {
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        image?: string;
      }>;
      itemTotal: number;
      deliveryFee: number;
      discount: number;
      grandTotal: number;
      deliveryMethod: string;
      shippingAddress?: string;
      prescriptionRequired?: boolean;
      storeId?: string;
      storeName?: string;
    };
  };
  Profile: undefined;
  Orders: undefined;
  OrderDetail: { order: any; scrollToBottom?: boolean; highlightReorder?: boolean };
  OrderSummary: { orderData: any };
  PaymentMethods: { 
    selectedAddress?: any;
    reorderItems?: any[];
    reorderTotal?: number;
    isReorder?: boolean;
    reorderMessage?: string;
  };
  RazorpayCheckout: {
    amount: number;
    currency?: string;
    name?: string;
    description: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    orderId: string;
    orderNumber: string;
    cartType: 'grocery' | 'pharma';
    deliveryMethod: string;
    isReorder?: boolean;
    reorderItems?: any[];
  };
  HelpCenter: undefined;
  AllProducts: {
    title: string;
    products: any[];
  };
  BannerDetail: { bannerId: string };
  PhoneAuth: { cartType: 'grocery' | 'pharma' };
  Register: { 
    phoneNumber: string; 
    cartType: 'grocery' | 'pharma'; 
  };
  OTPVerification: {
    phoneNumber: string;
    cartType: 'grocery' | 'pharma';
    isRegistration?: boolean;
    userData?: {
      firstName: string;
      lastName: string;
      email: string;
    };
    otpKey?: string;
  };
  CategoriesScreen: undefined;
  BrandsScreen: undefined;
  RecentlyBoughtScreen: undefined;
  GreatOffersScreen: undefined;
  EditProfile: undefined;
  MyAddresses: { fromPaymentMethods?: boolean };
  AddAddress: { 
    location?: { latitude: number; longitude: number; address: string };
    addressId?: string;
  };
  LocationPicker: { forAddress?: boolean };
  MyWishlist: undefined;
  AboutStore: { storeId?: string };
  ContactStore: undefined;
  LocateStore: undefined;
  AboutPassKiDukaan: undefined;
  Settings: undefined;
  Notifications: undefined;
  GroceryHome: { storeId: string };
  PharmacyHome: { storeId: string };
  SearchScreen: { autoFocus?: boolean; voiceSearch?: boolean };
  SearchResults: { query: string };
  SavedProducts: undefined;
  Under99Products: undefined;
  Under199Products: undefined;
  BrandDetail: { brand: string };
  OrderSelection: undefined;
  UploadPrescription: { orderId: string; storeId?: string };
  ImageViewer: { imageUrl: string; title?: string };
  InvoicePreview: { orderData: any };
};

export type HomeTabParamList = {
  Home: { 
    screen: 'HomeRoot', 
    params: { 
      storeId: string; 
      pincode?: string;
      storeType?: 'grocery' | 'pharma';
      storeName?: string;
    }
  };
  'Order Again': undefined;
  Categories: undefined;
  Pharmacy: {
    screen: 'PharmacyRoot',
    params: {
      storeId: string;
      pincode: string;
    };
  };
  Grocery: undefined;
};

export type HomeStackParamList = {
  HomeRoot: { 
    storeId: string; 
    pincode?: string; 
    storeType?: 'grocery' | 'pharma';
    storeName?: string;
  };
  ProductDetail: { product: any };
  CategoryDetail: { category: any & { selectedSubcategoryId?: string } };
  GreatOffersScreen: undefined;
  Cart: undefined;
  RecentlyBoughtScreen: undefined;
  BrandsScreen: undefined;
  CategoriesScreen: undefined;
};

export type CategoriesStackParamList = {
  CategoriesRoot: undefined;
  CategoryDetail: { category: any & { selectedSubcategoryId?: string } };
};

export type PharmacyStackParamList = {
  PharmacyRoot: { storeId: string, pincode: string };
  ProductDetail: { product: any };
  CategoryDetail: { category: any & { selectedSubcategoryId?: string } };
  GreatOffersScreen: undefined;
  Cart: undefined;
  RecentlyBoughtScreen: undefined;
  BrandsScreen: undefined;
  CategoriesScreen: undefined;
  MedicineDetail: { medicine: any };
};