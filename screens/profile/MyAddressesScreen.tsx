import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { addressService, Address } from '../../services/api/addressService';

type MyAddressesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MyAddresses'>;
type MyAddressesScreenRouteProp = RouteProp<RootStackParamList, 'MyAddresses'>;

const MyAddressesScreen = React.memo(() => {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation<MyAddressesScreenNavigationProp>();
  const route = useRoute<MyAddressesScreenRouteProp>();
  
  // Check if coming from PaymentMethodsScreen for address selection
  const { fromPaymentMethods = false } = route.params || {};
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [defaultAddressId, setDefaultAddressId] = useState<string | null>(null);

  // Debug logging
  console.log('🔍 MyAddressesScreen Debug:', {
    isAuthenticated,
    hasUser: !!user,
    addressesCount: addresses.length,
    isLoading,
  });

  // Load addresses when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated]);

  // Refresh addresses when screen comes into focus (e.g., after adding new address)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log('🔄 Screen focused - refreshing addresses...');
        loadAddresses();
      }
    }, [isAuthenticated])
  );

  const loadAddresses = async () => {
    try {
      console.log('🔄 Loading addresses...');
      const response = await addressService.getAddresses();
      
      if (response.success && response.data) {
        console.log(' Addresses loaded successfully:', response.data);
        
        // Handle nested response structure: { status: "success", data: [] }
        const responseData = response.data as any;
        const actualAddresses = responseData.data || responseData || [];
        console.log(' Actual addresses array:', actualAddresses);
        
        setAddresses(actualAddresses);
        
        // Set default address
        const defaultAddress = actualAddresses.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setDefaultAddressId(defaultAddress._id || null);
        }
      } else {
        console.log('  Failed to load addresses:', response.error);
        setAddresses([]);
      }
    } catch (error) {
      console.error('💥 Error loading addresses:', error);
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    console.log('🔄 Pull to refresh triggered...');
    setRefreshing(true);
    try {
      await loadAddresses();
      console.log(' Pull to refresh completed');
    } catch (error) {
      console.error('  Pull to refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const getTypeIcon = useCallback((label: string) => {
    switch (label.toLowerCase()) {
      case 'home':
        return 'home';
      case 'work':
        return 'work';
      case 'friends & family':
        return 'people';
      default:
        return 'location-on';
    }
  }, []);

  const getTypeColor = useCallback((label: string) => {
    switch (label.toLowerCase()) {
      case 'home':
        return '#4CAF50';
      case 'work':
        return '#2196F3';
      case 'friends & family':
        return '#FF9800';
      default:
        return '#9C27B0';
    }
  }, []);

  const handleAddAddress = useCallback(() => {
    navigation.navigate('LocationPicker', { forAddress: true });
  }, [navigation]);

  const handleDeleteAddress = useCallback(async (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await addressService.deleteAddress(addressId);
              if (response.success) {
                console.log(' Address deleted successfully');
                // Refresh addresses list
                await loadAddresses();
              } else {
                console.log('  Failed to delete address:', response.error);
                Alert.alert('Error', response.error || 'Failed to delete address');
              }
            } catch (error) {
              console.error('💥 Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address');
            }
          }
        }
      ]
    );
  }, []);

  const handleSetDefaultAddress = useCallback(async (addressId: string) => {
    try {
      const response = await addressService.setDefaultAddress(addressId);
      if (response.success) {
        console.log(' Default address set successfully');
        setDefaultAddressId(addressId);
        // Refresh addresses list
        await loadAddresses();
      } else {
        console.log('  Failed to set default address:', response.error);
        Alert.alert('Error', response.error || 'Failed to set default address');
      }
    } catch (error) {
      console.error('💥 Error setting default address:', error);
      Alert.alert('Error', 'Failed to set default address');
    }
  }, []);

  const handleSelectAddress = useCallback((address: Address) => {
    if (fromPaymentMethods) {
      // Return selected address to PaymentMethodsScreen
      navigation.navigate('PaymentMethods', { selectedAddress: address });
    } else {
      // Normal flow - set as default
      handleSetDefaultAddress(address.customerAddressId || '');
    }
  }, [fromPaymentMethods, navigation, handleSetDefaultAddress]);

  // Sort addresses: default first, then others
  const sortedAddresses = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  const renderAddressItem = useCallback(({ item }: { item: Address }) => (
    <View style={styles.addressItem}>
      <View style={styles.addressHeader}>
        <View style={[styles.typeIcon, { backgroundColor: getTypeColor(item.label) }]}>
          <MaterialIcons 
            name={getTypeIcon(item.label) as any} 
            size={20} 
            color={theme.colors.surface} 
          />
        </View>
        <View style={styles.addressInfo}>
          <Text style={styles.addressName}>{item.label}</Text>
          <Text style={styles.addressText}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.addressText}>
            {item.line1}, {item.line2 && `${item.line2}, `}{item.city}, {item.state} {item.pincode}
          </Text>
          <Text style={styles.addressText}>
            {item.country}
          </Text>
          <Text style={styles.addressText}>
            Mobile: {item.mobile} | Email: {item.email}
          </Text>
        </View>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteAddress(item.customerAddressId || '')}>
            <MaterialIcons name="delete" size={24} color={theme.colors.error} />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 6 }} onPress={() => navigation.navigate('AddAddress', { 
            addressId: item.customerAddressId,
            location: { 
              latitude: 28.6139, 
              longitude: 77.2090, 
              address: `${item.line1}, ${item.city}` 
            } 
          })}>
            <MaterialIcons name="edit" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {fromPaymentMethods && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <TouchableOpacity 
            onPress={() => handleSelectAddress(item)} 
            style={{ marginRight: 12 }}
          >
            <MaterialIcons 
              name={defaultAddressId === item.customerAddressId ? 'radio-button-checked' : 'radio-button-unchecked'} 
              size={22} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          <Text style={{ 
            color: theme.colors.primary, 
            fontWeight: 'bold', 
            marginRight: 16 
          }}>
            {defaultAddressId === item.customerAddressId ? 'Default' : 'Select this address'}
          </Text>
        </View>
      )}
    </View>
  ), [getTypeColor, getTypeIcon, theme.colors.surface, theme.colors.error, theme.colors.primary, handleDeleteAddress, handleSetDefaultAddress, defaultAddressId, navigation]);


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
      paddingTop: 30,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      marginRight: 16,
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
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      marginBottom: 24,
    },
    addButtonText: {
      color: theme.colors.surface,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    addressItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    addressHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    typeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    addressInfo: {
      flex: 1,
    },
    addressName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    addressText: {
      fontSize: 14,
      color: theme.colors.secondary,
      lineHeight: 20,
      marginBottom: 2,
    },
    deleteButton: {
      padding: 8,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.colors.secondary,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 24,
    },
    loginButton: {
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
    },
    loginButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.secondary,
      marginTop: 16,
    },
  });

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {fromPaymentMethods ? 'Select Delivery Address' : 'My Addresses'}
            </Text>
          </View>
          <View style={styles.loadingContainer}>
            <MaterialIcons name="hourglass-empty" size={64} color={theme.colors.secondary} />
            <Text style={styles.loadingText}>Loading addresses...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {fromPaymentMethods ? 'Select Delivery Address' : 'My Addresses'}
            </Text>
          </View>
          <View style={styles.emptyState}>
            <MaterialIcons name="person" size={64} color={theme.colors.secondary} />
            <Text style={styles.emptyStateText}>
              Please login to view your addresses.
            </Text>
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('PhoneAuth' as any, { cartType: 'grocery' })}
            >
              <Text style={styles.loginButtonText}>Login / Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Addresses</Text>
        </View>

        <View style={styles.content}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
            <MaterialIcons name="add-location" size={22} color={theme.colors.surface} />
            <Text style={styles.addButtonText}>Add New Address</Text>
          </TouchableOpacity>

          {addresses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="location-off" size={64} color={theme.colors.secondary} />
              <Text style={styles.emptyStateText}>
                No addresses saved yet. Add your first address to get started.
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedAddresses}
              keyExtractor={(item) => item._id || item.label}
              renderItem={renderAddressItem}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.primary}
                />
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
});

export default MyAddressesScreen; 