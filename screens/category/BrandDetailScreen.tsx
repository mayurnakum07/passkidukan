import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ScrollView, Dimensions, Modal, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ThemedButton from '../../components/ui/ThemedButton';
import { useCart } from '../../contexts/CartContext';

const { width, height } = Dimensions.get('window');

type BrandDetailRouteProp = RouteProp<RootStackParamList, 'BrandDetail'>;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BrandDetailScreen = () => {
  const route = useRoute<BrandDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { addToGroceryCart, removeFromCart } = useCart();
  const { brand } = route.params;
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_low_high' | 'price_high_low' | 'a_z' | 'z_a'>('relevance');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [productQuantities, setProductQuantities] = useState<{ [productId: string]: number }>({});
  // Add filterTabs and brandSearch state
  const [selectedFilterTab, setSelectedFilterTab] = useState('Brand');
  const [brandSearch, setBrandSearch] = useState('');
  const filterTabs = [
    { key: 'Brand', label: 'Brand' },
    { key: 'Type', label: 'Type' },
    { key: 'Quantity', label: 'Quantity' },
    { key: 'DietPref', label: 'Diet Prefe..' },
  ];

  // Filter products by brand - now using state instead of mock data
  let filteredProducts = products;
  if (sortBy === 'price_low_high') {
    filteredProducts = [...products].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_high_low') {
    filteredProducts = [...products].sort((a, b) => b.price - a.price);
  } else if (sortBy === 'a_z') {
    filteredProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'z_a') {
    filteredProducts = [...products].sort((a, b) => b.name.localeCompare(a.name));
  }

  const sortOptions = [
    { key: 'relevance', label: 'Relevance' },
    { key: 'price_low_high', label: 'Price: Low to High' },
    { key: 'price_high_low', label: 'Price: High to Low' },
    { key: 'a_z', label: 'A-Z' },
    { key: 'z_a', label: 'Z-A' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      {/* Top Bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={{ fontWeight: 'bold', fontSize: 20, color: theme.colors.text }}>{brand}</Text>
      </View>
      {/* Sort Bar */}
      <View style={{ backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: showFilterModal ? theme.colors.primary : theme.colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: theme.colors.border }}
            onPress={() => setShowFilterModal(true)}
          >
            <MaterialCommunityIcons name="filter-variant" size={18} color={showFilterModal ? '#fff' : theme.colors.text} />
            <Text style={{ marginLeft: 6, fontSize: 14, color: showFilterModal ? '#fff' : theme.colors.text }}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: showSortModal ? theme.colors.primary : theme.colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: theme.colors.border }}
            onPress={() => setShowSortModal(true)}
          >
            <MaterialCommunityIcons name="sort" size={18} color={showSortModal ? '#fff' : theme.colors.text} />
            <Text style={{ marginLeft: 6, fontSize: 14, color: showSortModal ? '#fff' : theme.colors.text }}>Sort By</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        ListEmptyComponent={<Text style={{ color: theme.colors.secondary, textAlign: 'center', marginTop: 40 }}>No products available</Text>}
        renderItem={({ item: product }) => (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.colors.surface, borderRadius: 14, marginVertical: 7, marginHorizontal: 2, padding: 12, shadowColor: theme.colors.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#f2f2f2', position: 'relative' }}>
            <Image source={{ uri: product.image }} style={{ width: 80, height: 80, borderRadius: 10, marginRight: 12, backgroundColor: '#f0f0f0' }} />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 2 }}>{product.name}</Text>
              <Text style={{ fontSize: 15, color: theme.colors.primary, fontWeight: 'bold', marginBottom: 4 }}>₹{product.price.toFixed(2)}</Text>
              <Text style={{ fontSize: 13, color: theme.colors.secondary, marginBottom: 4 }}>{product.availableQty ? `In stock: ${product.availableQty}` : 'Available'}</Text>
              {/* +1/-1 Counter */}
              {productQuantities[product.id] > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 6, borderWidth: 1.5, borderColor: '#27ae60', height: 28, minWidth: 70, paddingHorizontal: 4, margin: 0 }}>
                  <TouchableOpacity onPress={() => {
                    setProductQuantities(q => {
                      const newQty = Math.max(0, (q[product.id] || 1) - 1);
                      if (newQty === 0) {
                        removeFromCart(product.id, 'grocery');
                        const { [product.id]: _, ...rest } = q;
                        return rest;
                      }
                      return { ...q, [product.id]: newQty };
                    });
                  }} style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#27ae60', fontWeight: 'bold', fontSize: 18 }}>-</Text>
                  </TouchableOpacity>
                  <Text style={{ width: 24, textAlign: 'center', color: '#27ae60', fontWeight: 'bold', fontSize: 16 }}>{productQuantities[product.id]}</Text>
                  <TouchableOpacity onPress={() => {
                    setProductQuantities(q => {
                      addToGroceryCart({ id: product.id, name: product.name, price: product.price, image: product.image });
                      return { ...q, [product.id]: (q[product.id] || 0) + 1 };
                    });
                  }} style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#27ae60', fontWeight: 'bold', fontSize: 18 }}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={{ backgroundColor: theme.colors.primary, borderRadius: 6, paddingHorizontal: 18, paddingVertical: 6, alignSelf: 'flex-start' }}
                  onPress={() => {
                    setProductQuantities(q => ({ ...q, [product.id]: 1 }));
                    addToGroceryCart({ id: product.id, name: product.name, price: product.price, image: product.image });
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
      {/* Sort Modal Sheet */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: theme.colors.text + '55' }} onPress={() => setShowSortModal(false)} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 24, minHeight: 220 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text }}>Sort By</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <MaterialCommunityIcons name="close" size={26} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              }}
              onPress={() => {
                setSortBy(option.key as any);
                setShowSortModal(false);
              }}
            >
              <MaterialCommunityIcons
                name={sortBy === option.key ? 'check-circle' : 'circle-outline'}
                size={22}
                color={sortBy === option.key ? theme.colors.primary : theme.colors.text}
                style={{ marginRight: 12 }}
              />
              <Text style={{ color: theme.colors.text, fontWeight: sortBy === option.key ? 'bold' : 'normal', fontSize: 16 }}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
      {/* Add Filter Modal after Sort Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: theme.colors.text + '55' }} onPress={() => setShowFilterModal(false)} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, minHeight: 480, maxHeight: height * 0.85 }}>
          {/* Top Bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222' }}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#222" />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', flex: 1 }}>
            {/* Left: Tabs */}
            <View style={{ width: 110, backgroundColor: '#F8F8F8', borderRightWidth: 1, borderRightColor: '#eee', paddingVertical: 8 }}>
              {filterTabs.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={{ paddingVertical: 14, paddingHorizontal: 10, backgroundColor: selectedFilterTab === tab.key ? '#fff' : 'transparent', borderLeftWidth: 3, borderLeftColor: selectedFilterTab === tab.key ? '#1A7B50' : 'transparent' }}
                  onPress={() => setSelectedFilterTab(tab.key)}
                >
                  <Text style={{ color: selectedFilterTab === tab.key ? '#1A7B50' : '#222', fontWeight: selectedFilterTab === tab.key ? 'bold' : 'normal', fontSize: 15 }}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Right: Filter Options */}
            <View style={{ flex: 1, padding: 16 }}>
              {selectedFilterTab === 'Brand' && (
                <>
                  <View style={{ backgroundColor: '#F4F4F4', borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 8 }}>
                    <MaterialCommunityIcons name="magnify" size={18} color="#888" />
                    <TextInput
                      style={{ flex: 1, height: 36, fontSize: 15, marginLeft: 6 }}
                      placeholder="Search"
                      placeholderTextColor="#aaa"
                      value={brandSearch}
                      onChangeText={setBrandSearch}
                    />
                  </View>
                  <ScrollView style={{ maxHeight: 260 }}>
                    {/* Replace with real brands list */}
                    {['Amul', 'Mother Dairy', 'Britannia', 'Nestle', 'Cadbury'].filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())).map((brand) => (
                      <TouchableOpacity
                        key={brand}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
                        // onPress: toggle brand selection
                      >
                        <MaterialCommunityIcons
                          name={'checkbox-blank-outline'}
                          size={22}
                          color={'#888'}
                          style={{ marginRight: 12 }}
                        />
                        <Text style={{ color: '#222', fontSize: 15 }}>{brand}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
              {/* Add similar blocks for other tabs (Type, Quantity, DietPref) as needed */}
            </View>
          </View>
          {/* Bottom Buttons */}
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee', padding: 12, backgroundColor: '#fff' }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#F4F4F4', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginRight: 8 }} onPress={() => { setSelectedPrice(null); }}>
              <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 15 }}>Clear filters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#1A7B50', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }} onPress={() => setShowFilterModal(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BrandDetailScreen; 