import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ProductCard from '../../components/product/ProductCard';
import { useAppContext } from '../../contexts/AppContext';
import storeService from '../../services/api/storeService';
import VoiceSearch from '../../components/search/VoiceSearch';

type SearchResultsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SearchResults'>;

interface SearchResult {
  categories: any[];
  subcategories: any[];
  products: any[];
}

interface Product {
  _id: string;
  name: string;
  // productMasterId: string;
  productMasterERPId: string;
  hsnCode: string;
  introduction?: string;
  description?: string;
  drugType?: string;
  packing?: string;
  manufacturer?: string;
  type?: string;
  categories: string[];
  status: string;
  storeId: string;
  signedImage?: string;
  image?: string;
  signedImages?: string[];
  images?: string[];
  fullName?: string; // Added fullName as fallback for product name
  productId?: string; // Added productId for pharmacy products
}

interface Category {
  _id: string;
  categoryERPId: string;
  name: string;
  description?: string;
  image?: string;
  signedImage?: string;
  status: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

interface Subcategory {
  _id: string;
  subcategoryERPId: string;
  categoryId: string;
  categoryERPId: string;
  name: string;
  description?: string;
  image?: string;
  signedImage?: string;
  status: string;
  subcategoryId: string;
  createdAt: string;
  updatedAt: string;
}

const SearchResultsScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<SearchResultsScreenNavigationProp>();
  const route = useRoute();
  const { selectedStore, lastVisitedStore, lastVisitedGroceryStore, lastVisitedPharmacyStore } = useAppContext();
  const { query } = route.params as { query: string };

  // Get the effective store to use (selectedStore or fallback to last visited stores)
  const effectiveStore = selectedStore || lastVisitedStore || lastVisitedGroceryStore || lastVisitedPharmacyStore;
  
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>(query);

  // Fetch search results from API
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!effectiveStore?.id) {
        setError('No store available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('🔍 Searching for:', currentQuery, 'in store:', effectiveStore.id);
        
        const response = await storeService.searchStoreProducts(effectiveStore.id, currentQuery);
        
        if (response.success && response.data) {
          console.log('🔍 Search results:', response.data);
          setSearchResults(response.data);
        } else {
          console.error('❌ Search failed:', response.error);
          setError(response.error || 'Search failed');
        }
      } catch (error) {
        console.error('❌ Search error:', error);
        setError('Failed to search products');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [currentQuery, effectiveStore?.id]);

  const handleProductPress = (product: Product) => {
    // Transform API product to expected format
    // Get all images in priority order
    const imageArray = product.signedImages || product.images || [];
    const productImage = product.signedImage || product.image || 
      (Array.isArray(imageArray) && imageArray.length > 0 ? imageArray[0] : undefined) ||
      '';
    
    // CRITICAL FIX: Ensure product name is set - use fullName as fallback
    const productName = product.name || product.fullName || 'Unknown Product';
    
    console.log('🔍 handleProductPress DEBUG:', {
      apiName: product.name,
      apiFullName: product.fullName,
      finalName: productName,
      // productMasterId: product.productMasterId,
      hasSignedImages: Array.isArray(product.signedImages),
      imageArrayLength: imageArray.length,
    });
    
    // Normalize API-facing product id so all flows use the same id for cart and orders
    const storeType = selectedStore?.type || 'grocery';
    const actualProductId = product.productId || (product as any).id || product._id;
    const productIdForApi = product.productId || actualProductId;

    const transformedProduct = {
      id: productIdForApi,
      name: productName,
      price: 0, // Price will be fetched from API in ProductDetail
      image: productImage,
      images: imageArray.length > 0 ? imageArray : undefined,
      category: storeType,
      description: product.description || '',
      productDescription: product.description || product.introduction || '',
      productId: productIdForApi,
      // productMasterId: product.productMasterId,
      // Include all relevant API fields for cart operations
      sp: 0, // Will be fetched from API
      availableQty: 0, // Will be fetched from API
      signedImages: product.signedImages || [],
    };
    
    console.log('🔍 Navigating to ProductDetail from search:', {
      productName: transformedProduct.name,
      productImage: transformedProduct.image?.substring(0, 50),
      imagesCount: transformedProduct.images?.length || 0,
      category: transformedProduct.category,
    });
    
    navigation.navigate('ProductDetail', { product: transformedProduct });
  };

  const handleCategoryPress = (category: Category) => {
    // Navigate to category screen
    navigation.navigate('CategoryProducts' as any, { 
      categoryId: category.categoryId,
      categoryName: category.name 
    });
  };

  const handleSubcategoryPress = (subcategory: Subcategory) => {
    // Navigate to subcategory screen
    navigation.navigate('SubcategoryProducts' as any, { 
      subcategoryId: subcategory.subcategoryId,
      subcategoryName: subcategory.name 
    });
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.secondary,
      marginTop: 12,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: 12,
    },
    resultsCount: {
      fontSize: 14,
      color: theme.colors.secondary,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
      marginTop: 16,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    categoryImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#f0f0f0',
      marginRight: 12,
    },
    categoryText: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    productsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    productCard: {
      width: '48%',
      minHeight: 220,
      backgroundColor: '#fff',
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: '#f0f0f0',
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginBottom: 16,
    },
    noResultsContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noResultsText: {
      fontSize: 16,
      color: theme.colors.secondary,
      textAlign: 'center',
      marginTop: 16,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Search Results</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Searching for "{currentQuery}"...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Search Results</Text>
          </View>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const totalResults = (searchResults?.categories?.length || 0) + 
                      (searchResults?.subcategories?.length || 0) + 
                      (searchResults?.products?.length || 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Results</Text>
        </View>

        {/* Voice search bar - updates currentQuery when speech recognized */}
        <VoiceSearch
          onResult={(text) => {
            if (text && text.trim().length > 0) {
              console.log('🔍 VoiceSearch result used as query:', text);
              setCurrentQuery(text.trim());
            }
          }}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultsCount}>
            {totalResults} results for "{currentQuery}"
          </Text>
          
          {totalResults === 0 ? (
            <View style={styles.noResultsContainer}>
              <MaterialIcons name="search-off" size={64} color={theme.colors.secondary} />
              <Text style={styles.noResultsText}>No results found for "{query}"</Text>
            </View>
          ) : (
            <>
              {/* Categories */}
              {searchResults?.categories && searchResults.categories.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Categories</Text>
                  {searchResults.categories.map((category: Category) => {
                    const categoryImage = category.signedImage || category.image || 'https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg';
                    
                    return (
                      <TouchableOpacity
                        key={category._id}
                        style={styles.categoryItem}
                        onPress={() => handleCategoryPress(category)}
                      >
                        <Image 
                          source={{ uri: categoryImage }} 
                          style={styles.categoryImage}
                          resizeMode="cover"
                        />
                        <Text style={styles.categoryText}>{category.name}</Text>
                        <MaterialIcons name="chevron-right" size={24} color={theme.colors.secondary} />
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Subcategories */}
              {searchResults?.subcategories && searchResults.subcategories.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Subcategories</Text>
                  {searchResults.subcategories.map((subcategory: Subcategory) => {
                    const subcategoryImage = subcategory.signedImage || subcategory.image || 'https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg';
                    
                    return (
                      <TouchableOpacity
                        key={subcategory._id}
                        style={styles.categoryItem}
                        onPress={() => handleSubcategoryPress(subcategory)}
                      >
                        <Image 
                          source={{ uri: subcategoryImage }} 
                          style={styles.categoryImage}
                          resizeMode="cover"
                        />
                        <Text style={styles.categoryText}>{subcategory.name}</Text>
                        <MaterialIcons name="chevron-right" size={24} color={theme.colors.secondary} />
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Products */}
              {searchResults?.products && searchResults.products.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Products</Text>
                  <View style={styles.productsGrid}>
                    {searchResults.products.map((product: Product) => {
                      const productImage = product.signedImage || product.image || 
                        (Array.isArray(product.signedImages) && product.signedImages.length > 0 ? product.signedImages[0] : undefined) ||
                        (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined) ||
                        '';
                      
                      return (
                        <TouchableOpacity
                          key={product._id}
                          style={styles.productCard}
                          onPress={() => handleProductPress(product)}
                          activeOpacity={0.88}
                        >
                          <Image 
                            source={{ uri: productImage }} 
                            style={{ width: 90, height: 90, borderRadius: 12, marginBottom: 10, backgroundColor: '#f7f7f7' }} 
                          />
                          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 6, textAlign: 'center', lineHeight: 18 }} numberOfLines={2}>
                            {product.name}
                          </Text>
                          <Text style={{ fontSize: 12, color: theme.colors.secondary, textAlign: 'center', marginBottom: 4 }}>
                            {product.manufacturer || 'Generic'}
                          </Text>
                          <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: 'bold', textAlign: 'center' }}>
                            View Details
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SearchResultsScreen; 