import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  TextInput,
  Platform,
  FlatList,
  Text,
  ScrollView,
  BackHandler,
  Image as RNImage,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, HomeStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import { useAppContext } from '../../contexts/AppContext';
import Drawer from '../../components/profile/ProfileDrawer';
import ProductCard from '../../components/product/ProductCard'
import BannerSlider from '../../components/common/BannerSlider';
import CategoryGrid from '../../components/common/CategoriesGrid';
import BrandsGrid from '../../components/common/BrandsGrid';
import HorizontallyScrollableSection from '../../components/layout/HorizontallyScrollableSection';
import SearchBar from '../../components/ui/SearchBar';

const Tab = createBottomTabNavigator();

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type HomeRouteProp = RouteProp<HomeStackParamList, 'HomeRoot'>;

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'grocery' | 'pharmacy';
}

interface SubCategory {
  id: string;
  name: string;
  products: Product[];
}

interface Category {
  id: string;
  name: string;
  subCategories: SubCategory[];
}


const Header = ({ onProfilePress, themedStyles }: { onProfilePress: () => void, themedStyles: any }) => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { totalItems } = useCart();
  const { selectedStore } = useAppContext();

  return (
    <View style={[themedStyles.header, { backgroundColor: theme.colors.surface }]}> 
      <TouchableOpacity onPress={onProfilePress} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialCommunityIcons 
          name="account-circle" 
          size={28} 
          color={theme.colors.text} 
        />
        {selectedStore && (
          <Text style={[themedStyles.storeName, {color: theme.colors.text, marginLeft: 10, fontWeight: 'bold', fontSize: 17}]} numberOfLines={1}>
            {selectedStore.name}
          </Text>
        )}
      </TouchableOpacity>
      <View style={themedStyles.headerRight}>
        <TouchableOpacity 
          style={themedStyles.headerIcon}
          onPress={() => navigation.navigate('GreatOffersScreen')}
        >
          <RNImage
            source={require('../../assets/discount.png')}
            style={{ width: 26, height: 26, resizeMode: 'contain', marginTop: 1 }}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={themedStyles.headerIcon}
          onPress={() => navigation.navigate('Cart')}
        >
          <MaterialCommunityIcons 
            name="cart" 
            size={24} 
            color={theme.colors.text} 
          />
          {totalItems > 0 && (
            <View style={[themedStyles.cartBadge, { backgroundColor: theme.colors.primary }]}> 
              <Text style={themedStyles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SearchResults = ({ results, onProductPress, activeTab, themedStyles }: { results: Product[], onProductPress: (product: Product) => void, activeTab: string, themedStyles: any }) => {
  const { theme } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [results]);

  if (results.length === 0) {
    return (
      <View style={themedStyles.noResultsContainer}>
        <MaterialIcons name="search-off" size={64} color={theme.colors.secondary} style={{ marginBottom: 12 }} />
        <Text style={[themedStyles.noResultsText, { color: theme.colors.text }]}>No products found in {activeTab}</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <Text style={themedStyles.searchResultsTitle}>Search Results</Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={themedStyles.searchResultCard}>
            <ProductCard 
              product={{...item, category: activeTab as 'grocery' | 'pharma'}} 
              onPress={() => onProductPress(item)}
              compact={true}
              hideCartButton={true}
            />
          </View>
        )}
        contentContainerStyle={themedStyles.searchResultsContainer}
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  );
};

const HomeScreen = () => {
  const { theme, setSection } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HomeRouteProp>();
  const { addToGroceryCart } = useCart();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const scrollY = new Animated.Value(0);

  const themedStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      paddingBottom: 14,
      elevation: 2,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    storeName: {
      marginLeft: 10,
      fontWeight: 'bold',
      fontSize: 17,
      color: theme.colors.primary,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 'auto',
    },
    headerIcon: {
      marginHorizontal: 8,
      position: 'relative',
    },
    cartBadge: {
      position: 'absolute',
      right: -8,
      top: -8,
      borderRadius: 12,
      width: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    cartBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    searchBarWrapper: {
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 8,
      backgroundColor: theme.colors.background,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
      marginBottom: 8,
      borderBottomWidth: 0,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      height: 40,
      paddingHorizontal: 8,
    },
    searchRight:{
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchActionIcon: {
      marginLeft: 10,
    },
    tabsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    tab: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
    },
    tabText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    contentContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    searchResultsContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    noResultsContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noResultsText: {
      fontSize: 16,
      textAlign: 'center',
      color: theme.colors.text,
    },
    section: {
      marginHorizontal: 12,
      marginTop: 18,
      marginBottom: 10,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      padding: 16,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    sectionTitle: {
      fontSize: 19,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      letterSpacing: 0.2,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    viewAll: {
      fontWeight: 'bold',
      color: theme.colors.primary,
      fontSize: 15,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      overflow: 'hidden',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    tabBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      paddingBottom: Platform.OS === 'ios' ? 20 : 10,
      borderTopWidth: 0,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    tabIconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
    },
    searchResultCard: {
      width: '100%',
      marginBottom: 12,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    searchResultsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 16,
      color: theme.colors.text,
    },
    searchResultsContainerGrid: {
      paddingHorizontal: 8,
      paddingBottom: 24,
    },
    searchResultCardGrid: {
      flex: 1,
      margin: 8,
      minWidth: 160,
      maxWidth: '48%',
    },
    searchGridRow: {
      justifyContent: 'space-between',
    },
    drawerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    searchPlaceholder: {
      flex: 1,
      fontSize: 16,
      paddingHorizontal: 8,
    },
  }), [theme]);

  useFocusEffect(
    React.useCallback(() => {
      setSection('grocery');
    }, [])
  );

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      if (isDrawerVisible) {
        setIsDrawerVisible(false);
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [isDrawerVisible]);

  const getAllProducts = () => {
    const allProducts: Product[] = [];
    // Remove mock data - products will be fetched from API
    return allProducts;
  };

  const toggleDrawer = () => setIsDrawerVisible(!isDrawerVisible);

  const handleOverlayPress = () => {
    setIsDrawerVisible(false);
  };

  const tabBarStyle = {
    ...themedStyles.tabBar,
    backgroundColor: theme.colors.surface,
    transform: [{
      translateY: scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 100],
        extrapolate: 'clamp',
      }),
    }],
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.length === 0) {
      setShowSearchResults(false);
      return;
    }

    const allProducts = getAllProducts();
    const filtered = allProducts.filter(product =>
      product.name.toLowerCase().includes(text.toLowerCase())
    );
    setSearchResults(filtered);
    setShowSearchResults(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { product });
  };

  useEffect(() => {
    // Here you would typically fetch data from an API
    // For now, we'll just simulate a loading delay
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={themedStyles.container} edges={['top']}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.surface} />
      <Header onProfilePress={toggleDrawer} themedStyles={themedStyles} />
      <View>
        <SearchBar
          onSearch={() => {}}
          placeholder="Search products..."
        />
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SearchScreen')}
        />
      </View>
      
      <View style={themedStyles.contentContainer}>
        {searchQuery.length > 0 ? (
          <SearchResults 
            results={searchResults} 
            onProductPress={handleProductPress} 
            activeTab={activeTab}
            themedStyles={themedStyles}
          />
        ) : (
          <ScrollView>
            <BannerSlider />
            <View style={themedStyles.section}>
              <Text style={[themedStyles.sectionTitle, {color: theme.colors.text}]}>Categories</Text>
              <CategoryGrid />
              <View style={{ alignItems: 'center', marginTop: 8 }}>
                <TouchableOpacity onPress={() => navigation.navigate('CategoriesScreen' as any)}>
                  <Text style={[themedStyles.viewAll, {color: theme.colors.primary}]}>View All</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={themedStyles.section}>
              <Text style={[themedStyles.sectionTitle, {color: theme.colors.text}]}>Shop by Brands</Text>
              <BrandsGrid />
              <View style={{ alignItems: 'center', marginTop: 8 }}>
                <TouchableOpacity onPress={() => navigation.navigate('BrandsScreen' as any)}>
                  <Text style={[themedStyles.viewAll, {color: theme.colors.primary}]}>View All</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Recently Bought Section */}
            <View style={themedStyles.section}>
              <View style={themedStyles.sectionHeaderRow}>
                <Text style={[themedStyles.sectionTitle, {color: theme.colors.text}]}>Recently Bought</Text>
                <TouchableOpacity onPress={() => navigation.navigate('RecentlyBoughtScreen' as any)}>
                  <Text style={[themedStyles.viewAll, {color: theme.colors.primary}]}>View All</Text>
                </TouchableOpacity>
              </View>
              <HorizontallyScrollableSection title="Recently Bought" />
            </View>
            {/* Great Offers Section */}
            <View style={themedStyles.section}>
              <View style={themedStyles.sectionHeaderRow}>
                <Text style={[themedStyles.sectionTitle, {color: theme.colors.text}]}>Great Offers</Text>
                <TouchableOpacity onPress={() => navigation.navigate('GreatOffersScreen' as any)}>
                  <Text style={[themedStyles.viewAll, {color: theme.colors.primary}]}>View All</Text>
                </TouchableOpacity>
              </View>
              <HorizontallyScrollableSection title="Great Offers" />
            </View>
          </ScrollView>
        )}
      </View>

      {isDrawerVisible && (
        <TouchableOpacity style={themedStyles.drawerOverlay} onPress={handleOverlayPress} activeOpacity={1}>
          <View style={{ flex: 1 }} />
          <Drawer onClose={toggleDrawer} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;