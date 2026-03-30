import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { addressService, CreateAddressRequest, Address } from '../../services/api/addressService';
import { googleMapsService, ReverseGeocodeResult } from '../../services/api/googleMapsService';

type AddAddressScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddAddress'>;

const { width, height } = Dimensions.get('window');

interface AddressFormData {
  label: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

const AddAddressScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<AddAddressScreenNavigationProp>();
  const route = useRoute();
  const { location, addressId } = route.params as { 
    location?: { latitude: number; longitude: number; address: string };
    addressId?: string;
  };
  
  const [formData, setFormData] = useState<AddressFormData>({
    label: 'Home',
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Debug logging
  console.log('🔍 AddAddressScreen Debug:', {
    addressId,
    isEditMode,
    hasUser: !!user,
    location: location?.address
  });

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        mobile: user.mobile || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  // Load address data if in edit mode
  useEffect(() => {
    if (addressId) {
      setIsEditMode(true);
      loadAddressData(addressId);
    }
  }, [addressId]);

  // Auto-fill address fields when location is provided
  useEffect(() => {
    if (location && !isEditMode) {
      autoFillAddressFromLocation(location.latitude, location.longitude);
    }
  }, [location, isEditMode]);

  const autoFillAddressFromLocation = async (latitude: number, longitude: number) => {
    try {
      console.log('🗺️ Auto-filling address from location:', { latitude, longitude });
      const addressResult = await googleMapsService.reverseGeocode(latitude, longitude);
      
      if (addressResult) {
        console.log(' Address auto-filled from Google Maps:', addressResult);
        setFormData(prev => ({
          ...prev,
          city: addressResult.city || prev.city,
          state: addressResult.state || prev.state,
          pincode: addressResult.pincode || prev.pincode,
          country: addressResult.country || prev.country,
          line1: prev.line1 || addressResult.address.split(',')[0] || '',
        }));
      }
    } catch (error) {
      console.error('  Error auto-filling address:', error);
    }
  };

  const loadAddressData = async (id: string) => {
    setIsLoadingAddress(true);
    try {
      console.log('🔄 Loading address data for editing...');
      const response = await addressService.getAddressById(id);
      
      if (response.success && response.data) {
        console.log(' Address data loaded for editing:', response.data);
        
        // Handle nested response structure
        const addressData = response.data as any;
        const actualAddress = addressData.data || addressData;
        
        setFormData({
          label: actualAddress.label || 'Home',
          firstName: actualAddress.firstName || '',
          lastName: actualAddress.lastName || '',
          mobile: actualAddress.mobile || '',
          email: actualAddress.email || '',
          line1: actualAddress.line1 || '',
          line2: actualAddress.line2 || '',
          city: actualAddress.city || '',
          state: actualAddress.state || '',
          pincode: actualAddress.pincode || '',
          country: actualAddress.country || 'India',
        });
      } else {
        console.log('  Failed to load address data:', response.error);
        Alert.alert('Error', response.error || 'Failed to load address data');
      }
    } catch (error) {
      console.error('💥 Error loading address data:', error);
      Alert.alert('Error', 'Failed to load address data');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const labelOptions = [
    { key: 'Home', label: 'Home', icon: 'home' },
    { key: 'Work', label: 'Work', icon: 'work' },
    { key: 'Friends & Family', label: 'Friends & Family', icon: 'people' },
    { key: 'Other', label: 'Other', icon: 'location-on' },
  ];

  const handleTextChange = (field: keyof AddressFormData, value: string) => {
        setFormData({ ...formData, [field]: value });
  };

  const validateForm = (): boolean => {
    if (!formData.label.trim()) {
      Alert.alert('Error', 'Please select an address label');
      return false;
    }
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'First Name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'Last Name is required');
      return false;
    }
    if (!formData.mobile.trim()) {
      Alert.alert('Error', 'Mobile number is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!formData.line1.trim()) {
      Alert.alert('Error', 'Address Line 1 is required');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'City is required');
      return false;
    }
    if (!formData.state.trim()) {
      Alert.alert('Error', 'State is required');
      return false;
    }
    if (!formData.pincode.trim()) {
      Alert.alert('Error', 'Pincode is required');
      return false;
    }
    if (!formData.country.trim()) {
      Alert.alert('Error', 'Country is required');
      return false;
    }
    return true;
  };

  const handleSaveAddress = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const addressData: CreateAddressRequest = {
        label: formData.label,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        line1: formData.line1.trim(),
        line2: formData.line2.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        country: formData.country.trim(),
      };

      console.log('💾 Saving address data:', addressData);
      
      if (isEditMode) {
        const response = await addressService.updateAddress(addressId!, addressData);
        if (response.success && response.data) {
          console.log(' Address updated successfully:', response.data);
          Alert.alert(
            'Success',
            'Address updated successfully!',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigate back to MyAddresses which will automatically refresh
                  navigation.navigate('MyAddresses', {});
                }
              },
            ]
          );
        } else {
          console.log('  Failed to update address:', response.error);
          Alert.alert('Error', response.error || 'Failed to update address. Please try again.');
        }
      } else {
        const response = await addressService.createAddress(addressData);
        if (response.success && response.data) {
          console.log(' Address saved successfully:', response.data);
    Alert.alert(
      'Success',
      'Address saved successfully!',
      [
        {
          text: 'OK',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Main" }],
                  });
                }
        },
      ]
    );
        } else {
          console.log('  Failed to save address:', response.error);
          Alert.alert('Error', response.error || 'Failed to save address. Please try again.');
        }
      }
    } catch (error) {
      console.error('💥 Error saving address:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 64,
    },
    mapContainer: {
      height: 150,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 24,
    },
    map: {
      width: '100%',
      height: '100%',
    },
    locationText: {
      fontSize: 14,
      color: theme.colors.secondary,
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      color: theme.colors.secondary,
      marginBottom: 8,
      fontWeight: '500',
    },
    requiredLabel: {
      color: theme.colors.error,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.white,
    },
    labelContainer: {
      marginBottom: 24,
    },
    labelLabel: {
      fontSize: 14,
      color: theme.colors.secondary,
      marginBottom: 12,
      fontWeight: '500',
    },
    labelButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    labelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minWidth: (width - 48) / 2 - 4,
    },
    labelButtonSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    labelButtonText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '500',
    },
    labelButtonTextSelected: {
      color: theme.colors.surface,
    },
    labelButtonTextUnselected: {
      color: theme.colors.text,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 16,
      opacity: isLoading ? 0.6 : 1,
    },
    saveButtonText: {
      color: theme.colors.surface,
      fontSize: 16,
      fontWeight: 'bold',
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
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Edit Address' : 'Add New Address'}
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Map Preview */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location?.latitude || 28.6139,
                longitude: location?.longitude || 77.2090,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              mapType="standard"
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
              showsBuildings={true}
              showsIndoors={true}
              showsTraffic={false}
              showsPointsOfInterest={true}
              rotateEnabled={true}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={true}
              loadingEnabled={true}
              loadingIndicatorColor={theme.colors.primary}
              loadingBackgroundColor={theme.colors.background}
              moveOnMarkerPress={false}
              followsUserLocation={false}
              maxZoomLevel={20}
              minZoomLevel={3}
            >
              <Marker
                coordinate={{
                  latitude: location?.latitude || 28.6139,
                  longitude: location?.longitude || 77.2090,
                }}
                title="Selected Location"
                description={location?.address || 'Selected Location'}
                pinColor={theme.colors.primary}
              />
            </MapView>
          </View>

          <Text style={styles.locationText}>
            {location?.address || 'Selected Location'}
          </Text>

          {/* Address Label Section */}
          <View style={styles.labelContainer}>
            <Text style={styles.labelLabel}>Address Label</Text>
            <View style={styles.labelButtons}>
              {labelOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.labelButton,
                    formData.label === option.key && styles.labelButtonSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, label: option.key })}
                >
                  <MaterialIcons
                    name={option.icon as any}
                    size={20}
                    color={
                      formData.label === option.key
                        ? theme.colors.surface
                        : theme.colors.primary
                    }
                  />
                  <Text
                    style={[
                      styles.labelButtonText,
                      formData.label === option.key
                        ? styles.labelButtonTextSelected
                        : styles.labelButtonTextUnselected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Personal Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, styles.requiredLabel]}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => handleTextChange('firstName', text)}
                placeholder="Enter first name"
                placeholderTextColor={theme.colors.secondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, styles.requiredLabel]}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => handleTextChange('lastName', text)}
                placeholder="Enter last name"
                placeholderTextColor={theme.colors.secondary}
              />
            </View>

            <View style={styles.inputContainer}>
  <Text style={[styles.inputLabel, styles.requiredLabel]}>Mobile Number *</Text>
  <TextInput
    style={styles.input}
    value={formData.mobile}
    onChangeText={(text) => {
      // Remove any non-digit characters
      const numericText = text.replace(/[^0-9]/g, '');
      
      // Check if trying to enter more than 10 digits
      if (numericText.length > 10) {
        Alert.alert(
          'Invalid Input',
          'Mobile number cannot exceed 10 digits',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Update with valid input
      handleTextChange('mobile', numericText);
    }}
    placeholder="Enter mobile number"
    placeholderTextColor={theme.colors.secondary}
    keyboardType="phone-pad"
    maxLength={10}
  />
</View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, styles.requiredLabel]}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => handleTextChange('email', text)}
                placeholder="Enter email"
                placeholderTextColor={theme.colors.secondary}
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Address Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, styles.requiredLabel]}>Address Line 1 *</Text>
              <TextInput
                style={styles.input}
                value={formData.line1}
                onChangeText={(text) => handleTextChange('line1', text)}
                placeholder="House/Flat/Block No., Street"
                placeholderTextColor={theme.colors.secondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Address Line 2</Text>
              <TextInput
                style={styles.input}
                value={formData.line2}
                onChangeText={(text) => handleTextChange('line2', text)}
                placeholder="Apartment/Road/Area (optional)"
                placeholderTextColor={theme.colors.secondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, styles.requiredLabel]}>City *</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => handleTextChange('city', text)}
                placeholder="Enter city"
                placeholderTextColor={theme.colors.secondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, styles.requiredLabel]}>State *</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => handleTextChange('state', text)}
                placeholder="Enter state"
                placeholderTextColor={theme.colors.secondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, styles.requiredLabel]}>Pincode *</Text>
              <TextInput
                style={styles.input}
                value={formData.pincode}
                onChangeText={(text) => handleTextChange('pincode', text)}
                placeholder="Enter pincode"
                placeholderTextColor={theme.colors.secondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, styles.requiredLabel]}>Country *</Text>
              <TextInput
                style={styles.input}
                value={formData.country}
                onChangeText={(text) => handleTextChange('country', text)}
                placeholder="Enter country"
                placeholderTextColor={theme.colors.secondary}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSaveAddress}
            disabled={isLoading || isLoadingAddress}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? (isEditMode ? 'Updating...' : 'Saving...') : 
               isLoadingAddress ? 'Loading...' : 
               (isEditMode ? 'Update Address' : 'Save Address')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default AddAddressScreen; 