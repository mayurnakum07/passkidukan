import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../contexts/AppContext';
import storeService, { formatStoreAddress } from '../../services/api/storeService';

const AboutStoreScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedStore, lastVisitedStore, lastVisitedGroceryStore, lastVisitedPharmacyStore } = useAppContext();
  const [storeData, setStoreData] = useState<any>(null);
  const [formattedStoreAddress, setFormattedStoreAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const params = route.params as any;
  const storeId = params?.storeId || selectedStore?.id;
  const displayStore = selectedStore || lastVisitedStore || lastVisitedGroceryStore || lastVisitedPharmacyStore;

  useEffect(() => {
    if (storeId) {
      if (params?.store) {
        setStoreData(params.store);
        const coords = params.store?.location?.coordinates;
        if (params.store?.address || coords) {
          setFormattedStoreAddress(formatStoreAddress(params.store.address || {}, coords));
        }
      } else {
        fetchStoreDetails(storeId);
      }
    } else if (selectedStore) {
      fetchStoreDetails(selectedStore.id);
    }
  }, [storeId, params?.store, selectedStore?.id]);

  const fetchStoreDetails = async (storeId: string) => {
    setLoading(true);
    try {
      console.log('🔍 Fetching store details for deep link storeId:', storeId);
      const response = await storeService.getStoreDetailsById(storeId);
      
           if (response.success && response.data) {
             console.log('✅ Store details fetched for deep link:', response.data);
             const storeData = (response.data as any).data || response.data;
             setStoreData(storeData);
             
             // Format the address with coordinates if available
             const coordinates = storeData.location?.coordinates;
             if (storeData.address || coordinates) {
               const formattedAddress = formatStoreAddress(storeData.address || {}, coordinates);
               setFormattedStoreAddress(formattedAddress);
             }
           } else {
        console.log('❌ Store not found for deep link storeId:', storeId);
        Alert.alert(
          'Store Not Found',
          'The store you\'re looking for could not be found.',
          [
            { text: 'Go Back', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('💥 Error fetching store details for deep link:', error);
      Alert.alert(
        'Error',
        'Failed to load store details.',
        [
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const storeName = storeData?.name || selectedStore?.name || 'About Store';
  const address = formattedStoreAddress || storeData?.address || (storeData?.config?.address && typeof storeData.config.address === 'string' ? storeData.config.address : null) || 'Address not available';
  const phone = storeData?.mobile || storeData?.phone || (storeData?.config as any)?.phone;
  const email = storeData?.email || (storeData?.config as any)?.email;
  const coordinates = storeData?.location?.coordinates as [number, number] | undefined;

  const handleCall = () => {
    if (!phone) { Alert.alert('', 'Phone number not available'); return; }
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('', 'Unable to make call'));
  };
  const handleEmail = () => {
    if (!email) { Alert.alert('', 'Email not available'); return; }
    Linking.openURL(`mailto:${email}`).catch(() => Alert.alert('', 'Unable to open email'));
  };
  const handleLocate = () => {
    if (coordinates && coordinates.length === 2) {
      const [lat, lng] = coordinates;
      Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`).catch(() => Alert.alert('', 'Unable to open maps'));
    } else if (address && address !== 'Address not available') {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`).catch(() => Alert.alert('', 'Unable to open maps'));
    } else {
      Alert.alert('', 'Location not available');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>About Store</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={[styles.section, { backgroundColor: theme.colors.surface, alignItems: 'center', padding: 24 }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.description, { color: theme.colors.text, marginTop: 12 }]}>Loading store details...</Text>
          </View>
        ) : (
          <>
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: 20 }]}>{storeName}</Text>
              {/* <Text style={[styles.description, { color: theme.colors.text, marginTop: 12 }]}>
                {formattedStoreAddress || storeData?.address}
              </Text> */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 12 }}>
                {phone ? (
                  <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.colors.primary }]} onPress={handleCall}>
                    <MaterialCommunityIcons name="phone" size={20} color="#fff" />
                    <Text style={styles.contactBtnText}>Call</Text>
                  </TouchableOpacity>
                ) : null}
                {email ? (
                  <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.colors.primary }]} onPress={handleEmail}>
                    <MaterialCommunityIcons name="email" size={20} color="#fff" />
                    <Text style={styles.contactBtnText}>Email</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.colors.primary }]} onPress={handleLocate}>
                  <MaterialCommunityIcons name="map-marker" size={20} color="#fff" />
                  <Text style={styles.contactBtnText}>Locate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  contactBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AboutStoreScreen; 