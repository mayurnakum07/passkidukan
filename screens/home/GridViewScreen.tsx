// GridViewScreen.tsx
import React from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';

type GridViewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AllProducts'>;

interface GridViewScreenProps {
  route: {
    params: {
      title: string;
      products: Array<{
        id: string;
        name: string;
        price: number;
        image: string;
      }>;
    };
  };
}

const GridViewScreen: React.FC<GridViewScreenProps> = ({ route }) => {
  const { theme } = useTheme();
  const navigation = useNavigation<GridViewScreenNavigationProp>();
  const { title, products } = route.params;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    backButton: {
      marginRight: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    gridContainer: {
      flex: 1,
    },
    itemContainer: {
      flex: 1,
      margin: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      elevation: 2,
    },
    itemImage: {
      width: '100%',
      height: 120,
      resizeMode: 'cover',
    },
    itemDetails: {
      padding: 12,
    },
    itemName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    itemPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
  });

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { padding: 16 }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={{ color: theme.colors.primary, fontSize: 16 }}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[styles.gridContainer, { paddingBottom: 32 }]}
      />
    </SafeAreaView>
  );
};

export default GridViewScreen;