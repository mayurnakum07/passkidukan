import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppContext } from '../../contexts/AppContext';
import { storeService, formatStoreAddress } from '../../services/api/storeService';

type ContactStoreScreenNavigationProp = any;

const ContactStoreScreen = () => {
  const { theme } = useTheme();
  const { selectedStore } = useAppContext();
  const navigation = useNavigation<ContactStoreScreenNavigationProp>();
  const route = useRoute();
  const [storeDetails, setStoreDetails] = useState<any>(null);
  const [formattedStoreAddress, setFormattedStoreAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreDetails();
  }, []);

  const fetchStoreDetails = async () => {
    try {
      setLoading(true);
      
      // Use storeId from route params if available, otherwise use selectedStore
      const storeId = (route.params as any)?.storeId || selectedStore?.id;
      
      if (!storeId) {
        Alert.alert('Error', 'Store information not available');
        navigation.goBack();
        return;
      }

      console.log('📞 Fetching store details for contact:', storeId);
      
      const response = await storeService.getStoreDetailsById(storeId);
      
      if (response.success && response.data) {
        console.log('✅ Store details fetched:', response.data);
        const storeData = (response.data as any).data || response.data;
        console.log('📧 Store email:', storeData.email);
        console.log('📱 Store mobile:', storeData.mobile);
        setStoreDetails(storeData);
        
        // Format the address with coordinates if available
        const coordinates = storeData.location?.coordinates;
        if (storeData.address || coordinates) {
          const formattedAddress = formatStoreAddress(storeData.address || {}, coordinates);
          setFormattedStoreAddress(formattedAddress);
        }
      } else {
        console.log('❌ Failed to fetch store details:', response.error);
        // Fallback to selectedStore data
        if (selectedStore) {
          console.log('🔄 Using selectedStore as fallback:', selectedStore);
        console.log('📧 Fallback email:', (selectedStore as any).email);
        console.log('📱 Fallback mobile:', (selectedStore as any).mobile);
          setStoreDetails(selectedStore);
        } else {
          Alert.alert('Error', 'Unable to fetch store details');
        }
      }
    } catch (error) {
      console.log('❌ Error fetching store details:', error);
      // Fallback to selectedStore data
      if (selectedStore) {
        console.log('🔄 Using selectedStore as fallback (catch):', selectedStore);
        console.log('📧 Fallback email (catch):', (selectedStore as any).email);
        console.log('📱 Fallback mobile (catch):', (selectedStore as any).mobile);
        setStoreDetails(selectedStore);
      } else {
        Alert.alert('Error', 'Unable to fetch store details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneCall = (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }

    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch((error) => {
      console.log('❌ Error opening phone app:', error);
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const handleEmailContact = (email: string) => {
    if (!email) {
      Alert.alert('Error', 'Email address not available');
      return;
    }

    const emailUrl = `mailto:${email}`;
    Linking.openURL(emailUrl).catch((error) => {
      console.log('❌ Error opening email app:', error);
      Alert.alert('Error', 'Unable to open email app');
    });
  };


  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading store information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!storeDetails) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons 
            name="store-alert" 
            size={64} 
            color={theme.colors.error} 
          />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Store information not available
          </Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.colors.text} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Contact Store
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Store Info Card */}
        <View style={[styles.storeCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.storeHeader}>
            <MaterialCommunityIcons 
              name="store" 
              size={32} 
              color={theme.colors.primary} 
            />
            <View style={styles.storeInfo}>
              <Text style={[styles.storeName, { color: theme.colors.text }]}>
                {storeDetails.name || 'Store Name'}
              </Text>
              <Text style={[styles.storeType, { color: theme.colors.secondary }]}>
                {storeDetails.type === 'grocery' ? 'Grocery Store' : 'Pharmacy Store'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Options */}
        <View style={styles.contactSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Contact Options
          </Text>

          {/* Phone Call */}
          {storeDetails.mobile && (
            <TouchableOpacity 
              style={[styles.contactOption, { backgroundColor: theme.colors.surface }]}
              onPress={() => handlePhoneCall(storeDetails.mobile)}
            >
              <View style={styles.contactOptionLeft}>
                <MaterialCommunityIcons 
                  name="phone" 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <View style={styles.contactOptionText}>
                  <Text style={[styles.contactOptionTitle, { color: theme.colors.text }]}>
                    Call Store
                  </Text>
                  <Text style={[styles.contactOptionSubtitle, { color: theme.colors.secondary }]}>
                    {storeDetails.mobile}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={20} 
                color={theme.colors.secondary} 
              />
            </TouchableOpacity>
          )}


          {/* Email */}
          <TouchableOpacity 
            style={[styles.contactOption, { backgroundColor: theme.colors.surface }]}
            onPress={() => storeDetails.email ? handleEmailContact(storeDetails.email) : Alert.alert('Info', 'Email not available for this store')}
            disabled={!storeDetails.email}
          >
            <View style={styles.contactOptionLeft}>
              <MaterialCommunityIcons 
                name="email" 
                size={24} 
                color={storeDetails.email ? theme.colors.primary : theme.colors.secondary} 
              />
              <View style={styles.contactOptionText}>
                <Text style={[styles.contactOptionTitle, { color: theme.colors.text }]}>
                  Email Store
                </Text>
                <Text style={[styles.contactOptionSubtitle, { color: theme.colors.secondary }]}>
                  {storeDetails.email || 'Email not available'}
                </Text>
              </View>
            </View>
            {storeDetails.email && (
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={20} 
                color={theme.colors.secondary} 
              />
            )}
          </TouchableOpacity>

          {/* Address */}
          {storeDetails.address && (
            <View style={[styles.contactOption, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.contactOptionLeft}>
                <MaterialCommunityIcons 
                  name="map-marker" 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <View style={styles.contactOptionText}>
                  <Text style={[styles.contactOptionTitle, { color: theme.colors.text }]}>
                    Store Address
                  </Text>
               <Text style={[styles.contactOptionSubtitle, { color: theme.colors.secondary }]}>
                 {formattedStoreAddress || 'Store address not available'}
               </Text>
                </View>
              </View>
            </View>
          )}

          {/* Store Hours */}
          {storeDetails.storeHours && (
            <View style={[styles.contactOption, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.contactOptionLeft}>
                <MaterialCommunityIcons 
                  name="clock-outline" 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <View style={styles.contactOptionText}>
                  <Text style={[styles.contactOptionTitle, { color: theme.colors.text }]}>
                    Store Hours
                  </Text>
                  <Text style={[styles.contactOptionSubtitle, { color: theme.colors.secondary }]}>
                    {storeDetails.storeHours}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* No Contact Info Message */}
        {!storeDetails.mobile && !storeDetails.email && (
          <View style={[styles.noContactCard, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons 
              name="information" 
              size={32} 
              color={theme.colors.secondary} 
            />
            <Text style={[styles.noContactText, { color: theme.colors.text }]}>
              Contact information not available for this store
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  storeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  storeType: {
    fontSize: 14,
  },
  contactSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  contactOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  contactOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactOptionSubtitle: {
    fontSize: 14,
  },
  noContactCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  noContactText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContactStoreScreen;