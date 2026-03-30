import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Box, HStack, Text, IconButton } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../contexts/AppContext';
import storeService from '../../services/api/storeService';
import { storeProductService } from '../../services/api/storeProductService';
import apiClient from '../../services/api/client';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: screenWidth } = Dimensions.get('window');
// Calculate card width properly:
// - contentContainer paddingHorizontal: 16 (left) + 16 (right) = 32
// - margins between 4 cards: 8 * 3 = 24 (3 margins for 4 cards)
// - Total space used: 32 + 24 = 56
// - Available width: screenWidth - 56
// - Card width: (screenWidth - 56) / 4
const CARD_MARGIN_HORIZONTAL = 8;
const SECTION_PADDING_HORIZONTAL = 16;
const NUM_COLUMNS = 4;
const TOTAL_HORIZONTAL_SPACE = (SECTION_PADDING_HORIZONTAL * 2) + (CARD_MARGIN_HORIZONTAL * (NUM_COLUMNS - 1));
const CARD_WIDTH = (screenWidth - TOTAL_HORIZONTAL_SPACE) / NUM_COLUMNS;

const CategoriesScreen = () => {
  const { theme, section } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { selectedStore, lastVisitedStore, lastVisitedGroceryStore, lastVisitedPharmacyStore } = useAppContext();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Get the effective store to use (selectedStore or fallback to last visited stores)
  const effectiveStore = selectedStore || lastVisitedStore || lastVisitedGroceryStore || lastVisitedPharmacyStore;

  // Fetch categories with pagination
  const fetchCategories = async (page: number = 1, isLoadMore: boolean = false) => {
    if (!effectiveStore?.id) {
      console.log('   No store available, showing empty categories');
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      console.log(`🔄 Fetching ${section} categories page ${page} for store:`, effectiveStore.id);
      
      // Fetch single page from API
      const url = `/v1/store/${effectiveStore.id}/category/${section}`;
      const response = await apiClient.get<any>(url, { limit: 10, page });
      const raw = response.data;
      
      console.log(`🔍 ${section} API response page ${page}:`, JSON.stringify(raw, null, 2));
      
      if (raw?.status === 'success' && Array.isArray(raw?.data)) {
        const newCategories = raw.data;
        const count = raw.count || 0;
        
        setTotalCount(count);
        
        if (isLoadMore) {
          // Append new categories to existing ones
          setCategories(prev => {
            const updated = [...prev, ...newCategories];
            // Check if there are more pages to load
            setHasMore(updated.length < count);
            return updated;
          });
        } else {
          // Replace categories for first page
          setCategories(newCategories);
          // Check if there are more pages to load
          setHasMore(newCategories.length < count);
        }
        
        // Calculate total for logging (using current categories length + new items)
        const currentTotal = isLoadMore ? categories.length + newCategories.length : newCategories.length;
        console.log(`✅ ${section} categories page ${page} loaded: ${newCategories.length} items (${currentTotal}/${count} total)`);
      } else {
        console.log(`❌ ${section} API returned invalid data`);
        if (!isLoadMore) {
          setCategories([]);
        }
      }
    } catch (error) {
      console.log(`  Error fetching ${section} categories page ${page}:`, error);
      if (!isLoadMore) {
        setCategories([]);
      }
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Initial fetch
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    setTotalCount(0);
    fetchCategories(1, false);
  }, [effectiveStore?.id, section]);

  // Load more categories when scrolling
  const loadMoreCategories = () => {
    if (!loadingMore && hasMore && categories.length > 0) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchCategories(nextPage, true);
    }
  };

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    setTotalCount(0);
    await fetchCategories(1, false);
    setRefreshing(false);
  };

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.dark ? '#4B3F1D' : 'white',
          borderColor: theme.colors.border,
          shadowColor: theme.dark ? '#000' : '#FFD700',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
      ]}
      onPress={async () => {
        try {
          console.log('🔍 Category clicked:', item.name, 'ID:', item.categoryId);
          
          // Fetch category details from API
          const categoryResponse = await storeService.getCategoryDetails(effectiveStore?.id || '', item.categoryId);
          console.log('🔍 Category details API response:', JSON.stringify(categoryResponse, null, 2));
          
          if (categoryResponse.success && categoryResponse.data) {
            // Handle nested data structure: response.data.data or response.data
            const categoryData = Array.isArray(categoryResponse.data) ? categoryResponse.data : ((categoryResponse.data as any)?.data || categoryResponse.data);
            console.log('✅ Category details fetched:', JSON.stringify(categoryData, null, 2));
            
            navigation.navigate('CategoryDetail', { 
              category: { 
                id: item.categoryId,
                name: item.name,
                description: item.description,
                image: item.signedImage || item.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center',
                subCategories: categoryData.subcategories || [],
                products: categoryData.products || []
              } 
            });
          } else {
            // Fallback - navigate with empty subcategories, CategoryDetailScreen will fetch them
            navigation.navigate('CategoryDetail', { 
              category: { 
                id: item.categoryId,
                name: item.name,
                description: item.description,
                image: item.signedImage || item.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center',
                subCategories: [] // Empty - CategoryDetailScreen will fetch subcategories for this specific category
              } 
            });
          }
        } catch (error) {
          console.error('❌ Error fetching category details:', error);
          // Fallback - navigate with empty subcategories, CategoryDetailScreen will fetch them
          navigation.navigate('CategoryDetail', { 
            category: { 
              id: item.categoryId,
              name: item.name,
              description: item.description,
              image: item.signedImage || item.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center',
              subCategories: [] // Empty - CategoryDetailScreen will fetch subcategories for this specific category
            } 
          });
        }
      }}
      activeOpacity={0.8}
    >
      <Image 
        source={{ 
          uri: item.signedImage || item.image || 'https://i.ibb.co/vCkbyTDX/Whats-App-Image-2026-01-24-at-11-14-54-PM.jpg' 
        }} 
        style={styles.image} 
      />
      <Text 
        style={[styles.name, { color: theme.colors.text }]} 
        numberOfLines={2} 
        ellipsizeMode="tail"
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <Box bg={theme.colors.card} px={4} py={3} pt={20} flexDirection="row" alignItems="center">
          <IconButton
            icon={<MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />}
            onPress={() => navigation.goBack()}
            variant="ghost"
            size="sm"
          />
          <Text color={theme.colors.text} fontSize="lg" fontWeight="bold" flex={1} textAlign="center">
            All Categories
          </Text>
        </Box>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.text }}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (categories.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <Box bg={theme.colors.card} px={4} py={3} pt={20} flexDirection="row" alignItems="center">
          <IconButton
            icon={<MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />}
            onPress={() => navigation.goBack()}
            variant="ghost"
            size="sm"
          />
          <Text color={theme.colors.text} fontSize="lg" fontWeight="bold" flex={1} textAlign="center">
            All Categories
          </Text>
        </Box>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: theme.colors.text, fontSize: 16, textAlign: 'center' }}>
            No categories available for this store.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <Box bg={theme.colors.card} px={4} py={3} flexDirection="row" alignItems="center">
        <IconButton
          icon={<MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />}
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="sm"
        />
        <Text color={theme.colors.text} fontSize="lg" fontWeight="bold" flex={1} textAlign="center">
          All Categories
        </Text>
      </Box>
      <View style={{ flex: 1 }}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {section === 'pharma' ? 'Pharmacy Categories' : 'Grocery Categories'}
          </Text>
        </View>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.categoryId || item.id}
          numColumns={4}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: SECTION_PADDING_HORIZONTAL }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={loadMoreCategories}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={{ marginTop: 8, color: theme.colors.secondary, fontSize: 12 }}>
                  Loading more categories...
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Text style={{ color: theme.colors.secondary }}>
                  No categories available
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: CARD_MARGIN_HORIZONTAL,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 8,
  },
  name: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    width: '100%',
    overflow: 'hidden',
    flexWrap: 'wrap',
    paddingHorizontal: 0,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CategoriesScreen;