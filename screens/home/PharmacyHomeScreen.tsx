import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ProductCard from '../../components/product/ProductCard';
import PrescriptionRequiredTag from '../../components/ui/PrescriptionRequiredTag';
import StoreSection from '../../components/store/StoreSection';
import NearbyStores from '../../components/store/NearbyStores';
import { RootStackParamList, PharmacyStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppContext } from '../../contexts/AppContext';

// Define types
type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: 'grocery' | 'pharma';
  description?: string;
  manufacturer?: string;
  prescription?: boolean;
  productCategory?: string; // For pharmacy-specific categories like 'Pain Relief', 'Vitamins', etc.
};

type Store = {
  id: string;
  name: string;
  distance: string;
  rating: number;
  type: 'pharma';
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PharmacyHomeRouteProp = RouteProp<PharmacyStackParamList, 'PharmacyRoot'>;

const PharmacyHomeScreen = () => {
  const route = useRoute<PharmacyHomeRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { selectedStore, setSelectedStore, lastVisitedStore, lastVisitedPharmacyStore } = useAppContext();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<Store | null>(null);

  // Get the effective store to use (selectedStore or fallback to last visited stores)
  const effectiveStore = selectedStore || lastVisitedStore || lastVisitedPharmacyStore;

  useEffect(() => {
    // Get storeId from route params or effectiveStore
    const storeId = route.params?.storeId || effectiveStore?.id;
    const pincode = route.params?.pincode || effectiveStore?.pincode;
    
    if (!storeId) {
      console.log('💊 No pharmacy store available');
      setStore(null);
      setProducts([]);
      return;
    }
    
    // If we have an effectiveStore with matching id and type, use it
    if (effectiveStore && effectiveStore.id === storeId && effectiveStore.type === 'pharma') {
      setStore({
        id: effectiveStore.id,
        name: effectiveStore.name,
        distance: '0.8 km',
        rating: 4.7,
        type: 'pharma'
      });
      // Set as selectedStore if not already set
      if (!selectedStore || selectedStore.id !== effectiveStore.id) {
        setSelectedStore(effectiveStore);
      }
    } else {
      setStore({
        id: storeId,
        name: effectiveStore?.name || `Pharmacy Store ${storeId.split('-')[1] || storeId}`,
        distance: '0.8 km',
        rating: 4.7,
        type: 'pharma'
      });
    }
    // Products will be fetched from API - see fetchProducts below
  }, [route.params, effectiveStore, selectedStore, setSelectedStore]);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      const storeId = route.params?.storeId || effectiveStore?.id;
      if (!storeId) {
    setProducts([]);
        return;
      }

      try {
        console.log('💊 Fetching pharmacy products for store:', storeId);
        const { storeProductService } = await import('../../services/api/storeProductService');
        const response = await storeProductService.getPharmaProducts(storeId);
        
        if (response.success && Array.isArray(response.data)) {
          console.log(`💊 Loaded ${response.data.length} pharmacy products`);
          setProducts(response.data);
        } else {
          console.log('💊 No pharmacy products found');
          setProducts([]);
        }
      } catch (error) {
        console.error('💊 Error fetching pharmacy products:', error);
        setProducts([]);
      }
    };

    fetchProducts();
  }, [route.params?.storeId, effectiveStore?.id]);

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    scrollContent: {
      flexGrow: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    productContainer: {
      marginBottom: theme.spacing.md,
    },
    productsList: {
      paddingBottom: theme.spacing.md,
    },
    categorySection: {
      marginBottom: theme.spacing.lg,
    },
    categoryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    prescriptionBadge: {
      backgroundColor: theme.colors.error,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    prescriptionText: {
      color: theme.colors.surface,
      fontSize: 10,
      fontWeight: 'bold',
    },
  });

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productContainer}>
      <ProductCard 
        product={{... item, prescriptionRequired: item.prescription}} 
        onPress={() => handleProductPress(item)} 
      />
      {item.prescription && (
        // <View style={styles.prescriptionBadge}>
        //   <Text style={styles.prescriptionText}>PRESCRIPTION REQUIRED</Text>
        // </View>
        <PrescriptionRequiredTag style={{ marginRight: 8 }} />
      )}
    </View>
  );

  const renderCategorySection = (category: string) => {
    const categoryProducts = products.filter(product => product.productCategory === category);
    if (categoryProducts.length === 0) return null;

    return (
      <View key={category} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category}</Text>
        <FlatList
          data={categoryProducts}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.productsList}
        />
      </View>
    );
  };

  const categories = ['Pain Relief', 'Vitamins', 'Digestive Health', 'Allergy', 'Supplements'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {store && <StoreSection store={store} />}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.section}>
            <NearbyStores />
          </View>
          
          <View style={styles.section}>
            <Text style={styles.title}>Pharmacy Products</Text>
            {categories.map(category => renderCategorySection(category))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PharmacyHomeScreen; 