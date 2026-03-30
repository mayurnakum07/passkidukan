import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Box, HStack, Text, IconButton } from 'native-base';

const products = [
  { id: '1', name: 'Amul Milk 1L', image: 'https://blinkit.com/images/products/400/amul-taaza-homogenised-toned-milk.jpg', price: 65, originalPrice: 80 },
  { id: '2', name: 'Britannia Cheese Slices', image: 'https://blinkit.com/images/products/400/britannia-cheese-slices.jpg', price: 120, originalPrice: 150 },
  { id: '3', name: 'Mother Dairy Curd', image: 'https://blinkit.com/images/products/400/mother-dairy-dahi.jpg', price: 30, originalPrice: 40 },
  { id: '4', name: 'Tropicana Juice', image: 'https://blinkit.com/images/products/400/tropicana-orange-delight.jpg', price: 90, originalPrice: 100 },
  { id: '5', name: 'Cadbury Dairy Milk', image: 'https://blinkit.com/images/products/400/cadbury-dairy-milk-chocolate.jpg', price: 45, originalPrice: 55 },
  { id: '6', name: 'Parle-G Biscuits', image: 'https://blinkit.com/images/products/400/parle-g-original-glucose-biscuits.jpg', price: 10, originalPrice: 15 },
];

const RecentlyBoughtScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const renderItem = ({ item }: { item: typeof products[0] }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: 16,
          margin: 12,
          padding: 16,
          shadowColor: theme.colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
      onPress={() => Alert.alert('Product', item.name)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.image }} style={[styles.image, { borderRadius: 12, marginBottom: 10 }]} />
      <Text style={[styles.name, { color: theme.colors.text, fontWeight: 'bold', fontSize: 15, textAlign: 'center' }]} numberOfLines={2}>{item.name}</Text>
      <Text style={[styles.price, { color: theme.colors.primary }]}>₹{item.price.toFixed(2)}</Text>
      {item.originalPrice && item.originalPrice > item.price && (
        <Text style={[styles.price, { textDecorationLine: 'line-through', color: theme.colors.secondary, marginLeft: 6 }]}>₹{item.originalPrice.toFixed(2)}</Text>
      )}
      {item.originalPrice && item.originalPrice > item.price && (
        <Text style={[styles.price, { color: '#FF9800', marginLeft: 6 }]}>{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% off</Text>
      )}
    </TouchableOpacity>
  );
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
          Recently Bought
        </Text>
      </Box>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        columnWrapperStyle={{ justifyContent: 'space-between', gap: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flex: 1, justifyContent: 'space-around', marginBottom: 18 },
  gridContent: { paddingHorizontal: 12, paddingBottom: 24 },
  card: { width: '46%', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12, marginHorizontal: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  image: { width: 80, height: 80, borderRadius: 12, marginBottom: 10, backgroundColor: '#f0f0f0' },
  name: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 2 },
  price: { fontSize: 15, fontWeight: 'bold', marginTop: 4 },
});
export default RecentlyBoughtScreen; 