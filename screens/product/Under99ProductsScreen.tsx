import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ProductCard from '../../components/product/ProductCard';
import { storeProductService } from '../../services/api/storeProductService';
import { useAppContext } from '../../contexts/AppContext';

type Under99ProductsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Under99Products'>;

const INR_UNDER_99 = 99;

const Under99ProductsScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Under99ProductsScreenNavigationProp>();
  const { selectedStore, lastVisitedStore } = useAppContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const activeStoreId = useMemo(() => {
    return selectedStore?.id || lastVisitedStore?.id || 'c4defa9f-0bf2-4226-a4b9-6b578e737714';
  }, [selectedStore, lastVisitedStore]);

  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await storeProductService.getPharmaProducts(activeStoreId);
        const list = Array.isArray(resp.data) ? resp.data : [];
        const under99 = list.filter((p: any) => Number(p.price) <= INR_UNDER_99);
        if (mounted) setProducts(under99);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load products');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => { mounted = false; };
  }, [activeStoreId]);

  const handleProductPress = (product: any) => {
    navigation.navigate('ProductDetail', { product });
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
    productsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    productCard: {
      width: '48%',
      marginBottom: 12,
    },
  });

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
          <Text style={styles.headerTitle}>Under ₹99</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <ProductCard
                  product={product}
                  onPress={() => handleProductPress(product)}
                  compact={true}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Under99ProductsScreen; 