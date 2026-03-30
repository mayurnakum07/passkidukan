import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import orderListService from '../../services/api/orderListService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

type OrderSelectionRouteProp = {
  params: {
    // No specific params needed, we'll fetch all orders
  };
};

interface Order {
  orderId: string;
  orderNo: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  deliveryMethod: string;
  signedPresciptionUrl?: string;
  signedPrescriptionUrl?: string;
  prescriptionUrl?: string;
  storeId?: string;
  storeName?: string;
  type?: 'grocery' | 'pharma';
  prescriptionRequired?: boolean;
}

const OrderSelectionScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute() as OrderSelectionRouteProp;
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadSucceeded, setLoadSucceeded] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // Normalize status values from API to consistent format
  const normalizeStatus = (status: string | undefined): string => {
    if (!status) return 'pending';
    
    const statusLower = status.toLowerCase();
    
    // Handle various possible status values
    if (statusLower.includes('completed') || statusLower.includes('delivered') || statusLower.includes('success')) {
      return 'completed';
    }
    if (statusLower.includes('pending') || statusLower.includes('processing') || statusLower.includes('confirmed')) {
      return 'pending';
    }
    if (statusLower.includes('cancelled') || statusLower.includes('canceled') || statusLower.includes('failed')) {
      return 'cancelled';
    }
    if (statusLower.includes('paid') || statusLower.includes('payment')) {
      return 'paid';
    }
    
    // Default fallback
    return statusLower;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setLoadSucceeded(false);
      console.log('📋 Fetching orders for prescription upload...');
      
      // Fetch both grocery and pharmacy orders
      const [groceryResponse, pharmacyResponse] = await Promise.all([
        orderListService.getOrders('grocery'),
        orderListService.getOrders('pharma'),
      ]);

      const allOrders: Order[] = [];
      
      if (groceryResponse.success && groceryResponse.data) {
        console.log('🛒 Grocery orders response (will be ignored for prescription selection):', groceryResponse.data);
        allOrders.push(
          ...groceryResponse.data.map((order: any) => {
            console.log('🛒 Processing grocery order:', order);
            return {
              orderId: order.orderId || order.id,
              orderNo: order.orderNo || order.orderNumber || `#${order.orderId}`,
              status: normalizeStatus(order.status),
              totalAmount: order.totalAmount || order.total || 0,
              createdAt: order.createdAt || order.orderDate,
              deliveryMethod: order.deliveryMethod || 'Home Delivery',
              signedPresciptionUrl: order.signedPresciptionUrl,
              signedPrescriptionUrl: order.signedPrescriptionUrl,
              prescriptionUrl: order.prescriptionUrl,
              storeId: order.storeId,
              storeName: order.store?.name || order.storeName || 'Store',
              type: order.type || 'grocery',
              prescriptionRequired: order.prescriptionRequired,
            };
          }),
        );
      }

      if (pharmacyResponse.success && pharmacyResponse.data) {
        console.log('💊 Pharmacy orders response:', pharmacyResponse.data);
        allOrders.push(
          ...pharmacyResponse.data.map((order: any) => {
            console.log('💊 Processing pharmacy order:', order);
            return {
              orderId: order.orderId || order.id,
              orderNo: order.orderNo || order.orderNumber || `#${order.orderId}`,
              status: normalizeStatus(order.status),
              totalAmount: order.totalAmount || order.total || 0,
              createdAt: order.createdAt || order.orderDate,
              deliveryMethod: order.deliveryMethod || 'Home Delivery',
              signedPresciptionUrl: order.signedPresciptionUrl,
              signedPrescriptionUrl: order.signedPrescriptionUrl,
              prescriptionUrl: order.prescriptionUrl,
              storeId: order.storeId,
              storeName: order.store?.name || order.storeName || 'Store',
              type: order.type || 'pharma',
              prescriptionRequired: order.prescriptionRequired,
            };
          }),
        );
      }

      // Filter to only pharma orders for prescription upload
      // Additionally, only include orders where prescriptionRequired is true
      const pharmaOrdersOnly = allOrders.filter(
        (o) => (o.type || '').toLowerCase() === 'pharma' && o.prescriptionRequired === true,
      );
      // Sort by creation date (newest first)
      pharmaOrdersOnly.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      console.log('📋 Fetched pharma orders for prescription selection:', pharmaOrdersOnly.length);
      setOrders(pharmaOrdersOnly);
      const pharmaSuccess = !!(pharmacyResponse && pharmacyResponse.success && pharmacyResponse.data);
      setLoadSucceeded(pharmaSuccess);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setLoadSucceeded(false);
      Alert.alert('Error', 'Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (order: Order) => {
    console.log('📋 Selected order for prescription upload:', order.orderId);
    navigation.navigate('UploadPrescription', { orderId: order.orderId, storeId: order.storeId });
  };

  const getStatusDisplayText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'COMPLETED';
      case 'pending':
      case 'processing':
        return 'PENDING';
      case 'paid':
        return 'PAID';
      case 'cancelled':
      case 'failed':
        return 'CANCELLED';
      default:
        return status.toUpperCase();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return '#4CAF50';
      case 'pending':
      case 'processing':
        return '#FF9800';
      case 'paid':
        return '#2196F3';
      case 'cancelled':
      case 'failed':
        return '#F44336';
      default:
        return theme.colors.secondary;
    }
  };

  const hasPrescription = (order: Order) => {
    return !!(order.signedPresciptionUrl || order.signedPrescriptionUrl || order.prescriptionUrl);
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
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 30, // Increased from 20 to 30 to bring header down further
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    reloadButton: {
      padding: 8,
      marginLeft: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
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
    orderCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    orderNumberLabel: {
      fontSize: 12,
      color: theme.colors.primary,
      marginBottom: 4,
    },
    orderNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    orderDetails: {
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    detailLabel: {
      fontSize: 14,
      color: theme.colors.primary,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    prescriptionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    prescriptionIcon: {
      marginRight: 6,
    },
    prescriptionText: {
      fontSize: 14,
      fontWeight: '600',
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    uploadButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    viewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    viewButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
  });

  const renderOrderItem = ({ item }: { item: Order }) => {
    const prescriptionExists = hasPrescription(item);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumberLabel}>Order Number:</Text>
            <Text style={styles.orderNumber}>{item.orderNo}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>₹{item.totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Store Name</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.storeName || 'N/A'}
            </Text>
          </View>
        </View>

        {/* <View style={styles.prescriptionStatus}>
          <MaterialIcons
            name={prescriptionExists ? 'check-circle' : 'upload-file'}
            size={16}
            color={prescriptionExists ? '#4CAF50' : theme.colors.primary}
            style={styles.prescriptionIcon}
          /> */}
          {/* <Text
            style={[
              styles.prescriptionText,
              { color: prescriptionExists ? '#4CAF50' : theme.colors.primary },
            ]}
          >
            {prescriptionExists ? 'Prescription Uploaded' : 'Upload Prescription'}
          </Text> */}
        {/* </View> */}

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={[styles.viewButton, { flex: 1, marginRight: 8 }]}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.orderId })}
          >
            <MaterialIcons name="visibility" size={16} color="#fff" />
            <Text style={styles.viewButtonText}>View Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.uploadButton, { flex: 1, marginLeft: 8 }]}
            onPress={() => handleOrderSelect(item)}
          >
            <MaterialIcons name="upload" size={16} color="#fff" />
            <Text style={styles.uploadButtonText}>{prescriptionExists ? 'Re-upload Prescription' : 'Upload Prescription'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Select Order</Text>
            </View>
          </View>
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.emptyText, { fontWeight: '600', textAlign: 'center' }]}>
              Loading your orders...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Order for Prescription</Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            style={styles.reloadButton}
            disabled={refreshing}
          >
            <MaterialIcons 
              name="refresh" 
              size={24} 
              color={refreshing ? theme.colors.secondary : theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>

        {/* Orders List */}
        <View style={styles.content}>
          {loadSucceeded && orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt" size={64} color={theme.colors.secondary} />
              <Text style={styles.emptyText}>
                {isAuthenticated ? 'No order placed till now.' : 'Login to view your orders.'}
              </Text>
              {!isAuthenticated && (
                <TouchableOpacity
                  style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => navigation.navigate('PhoneAuth' as any, { cartType: 'grocery' })}
                >
                  <Text style={styles.loginButtonText}>Login / Sign Up</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={orders}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.orderId}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OrderSelectionScreen;
