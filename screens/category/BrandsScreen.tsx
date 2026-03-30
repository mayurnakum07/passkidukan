import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Box, HStack, Text, IconButton } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const brands = [
  { id: '1', name: 'Amul', image: 'https://seeklogo.com/images/A/amul-logo-7E6B2B7B2B-seeklogo.com.png' },
  { id: '2', name: 'Mother Dairy', image: 'https://seeklogo.com/images/M/mother-dairy-logo-6B7B2B7B2B-seeklogo.com.png' },
  { id: '3', name: 'Britannia', image: 'https://seeklogo.com/images/B/britannia-logo-7E6B2B7B2B-seeklogo.com.png' },
  { id: '4', name: 'Nestle', image: 'https://seeklogo.com/images/N/nestle-logo-7E6B2B7B2B-seeklogo.com.png' },
  { id: '5', name: 'Cadbury', image: 'https://seeklogo.com/images/C/cadbury-logo-7E6B2B7B2B-seeklogo.com.png' },
  { id: '6', name: 'Haldiram', image: 'https://seeklogo.com/images/H/haldiram-logo-7E6B2B7B2B-seeklogo.com.png' },
  { id: '7', name: 'Parle', image: 'https://seeklogo.com/images/P/parle-logo-7E6B2B7B2B-seeklogo.com.png' },
  { id: '8', name: 'Pepsi', image: 'https://seeklogo.com/images/P/pepsi-logo-7E6B2B7B2B-seeklogo.com.png' },
  { id: '9', name: 'Coca-Cola', image: 'https://seeklogo.com/images/C/coca-cola-logo-7E6B2B7B2B-seeklogo.com.png' },
  { id: '10', name: 'Tropicana', image: 'https://seeklogo.com/images/T/tropicana-logo-7E6B2B7B2B-seeklogo.com.png' },
];

const BrandsScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  const renderItem = ({ item }: { item: typeof brands[0] }) => (
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
      onPress={() => navigation.navigate('BrandDetail', { brand: item.name })}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.image }} style={[styles.image, { borderRadius: 12, marginBottom: 10 }]} />
      <Text style={[styles.name, { color: theme.colors.text, fontWeight: 'bold', fontSize: 15, textAlign: 'center' }]} numberOfLines={2}>{item.name}</Text>
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
          All Brands
        </Text>
      </Box>
      <View style={{ marginBottom: 16, marginTop: 12, padding: 12 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.card,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: theme.colors.border,
          elevation: 3,
          shadowColor: theme.colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        }}>
          <TextInput
            placeholder="Search brands..."
            value={search}
            onChangeText={setSearch}
            style={{
              flex: 1,
              paddingHorizontal: 18,
              paddingVertical: 10,
              fontSize: 16,
              color: theme.colors.text,
              backgroundColor: 'transparent',
            }}
            placeholderTextColor={theme.colors.text + '80'}
            returnKeyType="search"
            onSubmitEditing={() => setSearch(search)}
          />
          <MaterialCommunityIcons
            name="microphone"
            size={24}
            color={theme.colors.text + '80'}
            style={{ marginRight: 12 }}
          />
        </View>
      </View>
      <FlatList
        data={filteredBrands}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        columnWrapperStyle={{ justifyContent: 'space-between', gap: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { padding: 18, paddingBottom: 8, backgroundColor: 'transparent' },
  title: { fontSize: 22, fontWeight: 'bold', letterSpacing: 0.2 },
  row: { flex: 1, justifyContent: 'space-around', marginBottom: 18 },
  gridContent: { paddingHorizontal: 12, paddingBottom: 24 },
  card: { width: '30%', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8, marginHorizontal: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  image: { width: 60, height: 60, borderRadius: 30, marginBottom: 10, backgroundColor: '#f0f0f0' },
  name: { textAlign: 'center', fontSize: 13, fontWeight: '600', marginTop: 2 },
});
export default BrandsScreen; 