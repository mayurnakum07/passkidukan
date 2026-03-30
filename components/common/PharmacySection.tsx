import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ScrollView, 
  Animated,
  TouchableOpacity,
  Image,
  Modal
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import ProductCard from '../product/ProductCard';
import CategoryCard from '../product/CategoryCard';

type PharmacyNavigationProp = StackNavigationProp<RootStackParamList, 'AllProducts'>;

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
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

const pharmacyData: Category[] = [
  {
    id: '1',
    name: 'Medicines',
    subCategories: [
      {
        id: '1-1',
        name: 'Pain Relief',
        products: [
          { id: '1-1-1', name: 'Ibuprofen', price: 5.99, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
          { id: '1-1-2', name: 'Aspirin', price: 3.99, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
          { id: '1-1-3', name: 'Acetaminophen', price: 4.49, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
          { id: '1-1-4', name: 'Naproxen', price: 6.99, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
        ],
      },
      {
        id: '1-2',
        name: 'Cold & Flu',
        products: [
          { id: '1-2-1', name: 'Cold Syrup', price: 7.49, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
          { id: '1-2-2', name: 'Nasal Spray', price: 6.99, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
          { id: '1-2-3', name: 'Decongestant', price: 8.29, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'Vitamins',
    subCategories: [
      {
        id: '2-1',
        name: 'Multivitamins',
        products: [
          { id: '2-1-1', name: 'Men\'s Multivitamin', price: 12.99, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
          { id: '2-1-2', name: 'Women\'s Multivitamin', price: 12.99, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
          { id: '2-1-3', name: 'Senior Multivitamin', price: 14.99, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
        ],
      },
      {
        id: '2-2',
        name: 'Supplements',
        products: [
          { id: '2-2-1', name: 'Vitamin C', price: 8.99, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
          { id: '2-2-2', name: 'Vitamin D', price: 9.99, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
          { id: '2-2-3', name: 'Omega-3', price: 11.49, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
        ],
      },
    ],
  },
  {
    id: '3',
    name: 'Wellness',
    subCategories: [
      {
        id: '3-1',
        name: 'First Aid',
        products: [
          { id: '3-1-1', name: 'Bandages', price: 3.49, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
          { id: '3-1-2', name: 'Antiseptic', price: 4.99, image: 'https://cdn.pixabay.com/photo/2017/02/28/14/37/pills-2106003_1280.jpg' },
        ],
      },
    ],
  },
];

interface PharmacySectionProps {
  scrollY: Animated.Value;
  storeId?: string;
}

const PharmacySection: React.FC<PharmacySectionProps> = ({ scrollY, storeId }) => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(pharmacyData[0]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.text,
      margin: 16,
      marginBottom: 8,
    },
    subCategoryTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 12,
    },
    categoryContainer: {
      paddingLeft: 16,
      paddingBottom: 8,
    },
    productContainer: {
      paddingLeft: 16,
      paddingRight: 16,
      paddingBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    seeAll: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    featuredCard: {
      width: 280,
      height: 160,
      borderRadius: 12,
      margin: 8,
      overflow: 'hidden',
      position: 'relative',
    },
    featuredImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    featuredOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 12,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    featuredText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
    },
    featuredSubtext: {
      color: '#fff',
      fontSize: 14,
    },
    productCard: {
      width: 160,
      marginRight: 12,
    },
  });

  return (
    <ScrollView 
      style={styles.container}
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } }}],
        { useNativeDriver: false }
      )}
    >
      <Text style={styles.title}>Pharmacy</Text>
      
      {/* Featured Items */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.subCategoryTitle, { marginTop: 0 }]}>Health Essentials</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity style={styles.featuredCard}>
          <Image 
            source={{ uri: 'https://cdn.pixabay.com/photo/2017/05/25/15/08/pills-2343390_1280.jpg' }} 
            style={styles.featuredImage}
          />
          <View style={styles.featuredOverlay}>
            <Text style={styles.featuredText}>Cold & Flu</Text>
            <Text style={styles.featuredSubtext}>Relief for symptoms</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.featuredCard}>
          <Image 
            source={{ uri: 'https://cdn.pixabay.com/photo/2017/01/10/03/06/doctor-1968588_1280.jpg' }} 
            style={styles.featuredImage}
          />
          <View style={styles.featuredOverlay}>
            <Text style={styles.featuredText}>Immunity Boosters</Text>
            <Text style={styles.featuredSubtext}>Stay healthy</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Categories */}
      <Text style={styles.subCategoryTitle}>Categories</Text>
      <FlatList
        data={pharmacyData}
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            isSelected={selectedCategory?.id === item.id}
            onPress={() => setSelectedCategory(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      />

      {/* Products */}
      {selectedCategory && (
        <View>
          {selectedCategory.subCategories.map((subCategory) => (
            <View key={subCategory.id}>
              <View style={styles.sectionHeader}>
                <Text style={styles.subCategoryTitle}>{subCategory.name}</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={subCategory.products}
                renderItem={({ item }) => (
                  <ProductCard 
                    product={item} 
                    onPress={() => {}} 
                    style={styles.productCard}
                  />
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.productContainer}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default PharmacySection;