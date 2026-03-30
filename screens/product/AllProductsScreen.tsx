// screens/AllProductsScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  Dimensions,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ProductDetailModal from '../../components/product/ProductDetailModal';
import { MaterialIcons } from '@expo/vector-icons';
import { useCart } from '../../contexts/CartContext';
import { Box, HStack, Text, IconButton, Card, Button } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAppContext } from '../../contexts/AppContext';
import { storeProductService } from '../../services/api/storeProductService';

type AllProductsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AllProducts'>;

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2; // 48 = padding * 2 + margin * 2

const AllProductsScreen = () => {
  const { theme, section } = useTheme();
  const navigation = useNavigation<AllProductsScreenNavigationProp>();
  const route = useRoute();
  const { title, products: initialProducts } = route.params as { title: string; products: any[] };
  const { addToGroceryCart, addToPharmacyCart } = useCart();
  const { selectedStore, lastVisitedStore, lastVisitedGroceryStore, lastVisitedPharmacyStore } = useAppContext();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get the effective store to use (selectedStore or fallback to last visited stores)
  const effectiveStore = selectedStore || lastVisitedStore || lastVisitedGroceryStore || lastVisitedPharmacyStore;

  // Fetch products from API if store is selected
  const fetchProducts = async (isRefresh = false) => {
    if (!effectiveStore?.id) {
      console.log('   No store available, using fallback mock data');
      setProducts(initialProducts);
      return;
    }

    try {
      if (!isRefresh) {
        setLoading(true);
      }
      console.log(`🔄 Fetching ${section} products for store:`, effectiveStore.id);
      
      if (section === 'pharma') {
        const response = await storeProductService.getPharmaProducts(effectiveStore.id);
        if (response.success && response.data) {
          console.log(' Pharma products loaded from API');
          setProducts(response.data);
        } else {
          console.log('   Pharma API failed, using fallback mock data');
          setProducts(initialProducts);
        }
      } else {
        const response = await storeProductService.getGroceryProducts(effectiveStore.id);
        if (response.success && response.data) {
          console.log(' Grocery products loaded from API');
          setProducts(response.data);
        } else {
          console.log('   Grocery API failed, using fallback mock data');
          setProducts(initialProducts);
        }
      }
    } catch (error) {
      console.log(`  Error fetching ${section} products:`, error);
      console.log('   Using fallback mock data');
      setProducts(initialProducts);
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [effectiveStore?.id, section, initialProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(true);
    setRefreshing(false);
  };

  const handleProductPress = (product: any) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleAddToCart = (e: any, product: any) => {
    e.stopPropagation();
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price || 0,
      image: product.image,
      category: section,
      // Store the actual product ID that the API expects
      productId: product.id,
      prescriptionRequired: product.prescriptionRequired || false,
    };
    
    if (section === 'pharma') {
      addToPharmacyCart(cartItem);
    } else {
      addToGroceryCart(cartItem);
    }
    
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${product.name} has been added to your cart`,
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  const renderProductItem = ({ item }: { item: any }) => (
    <Card style={[styles.productCard, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity 
        onPress={() => handleProductPress(item)}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: item.image }} 
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productContent}>
          <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          
          <View style={styles.priceContainer}>
            <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
              ₹{item.price ? item.price.toFixed(2) : '0.00'}
            </Text>
            {item.originalPrice && item.originalPrice > item.price && (
              <Text style={[styles.originalPrice, { color: theme.colors.secondary }]}>
                ₹{item.originalPrice.toFixed(2)}
              </Text>
            )}
          </View>
          
          {item.originalPrice && item.originalPrice > item.price && (
            <Text style={[styles.discountText, { color: '#FF9800' }]}>
              {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% off
            </Text>
          )}
          
          <Button
            onPress={(e) => handleAddToCart(e, item)}
            style={[styles.addToCartButton, { backgroundColor: theme.colors.primary }]}
            colorScheme="primary"
            size="sm"
          >
            Add to Cart
          </Button>
        </View>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Box bg={theme.colors.surface} px={4} py={3} flexDirection="row" alignItems="center">
        <IconButton
          icon={<MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />}
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="sm"
        />
        <Text color={theme.colors.text} fontSize="lg" fontWeight="bold" flex={1} textAlign="center">
          {title}
        </Text>
      </Box>
      
      <View style={styles.container}>
        <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
          {products.length} products available
        </Text>
        
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />

        <ProductDetailModal
          visible={modalVisible}
          product={selectedProduct}
          onClose={closeModal}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0', // Example background color
    marginRight: 16,
    elevation: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333', // Example text color
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  gridContainer: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: itemWidth,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: '100%',
    height: itemWidth * 0.8, // Adjust height as needed
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productContent: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  discountText: {
    fontSize: 12,
    marginTop: 4,
  },
  addToCartButton: {
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addToCartButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AllProductsScreen;