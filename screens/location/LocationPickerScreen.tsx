// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   SafeAreaView,
//   Dimensions,
//   Alert,
//   TextInput,
//   FlatList,
// } from 'react-native';
// import { useTheme } from '../../contexts/ThemeContext';
// import { useNavigation } from '@react-navigation/native';
// import { RootStackParamList } from '../../navigation/types';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { MaterialIcons } from '@expo/vector-icons';
// import MapView, { Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { googleMapsService, ReverseGeocodeResult } from '../../services/api/googleMapsService';
// import { API_CONFIG } from '../../services/api/config';

// type LocationPickerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LocationPicker'>;

// const { width, height } = Dimensions.get('window');

// const LocationPickerScreen = () => {
//   const { theme } = useTheme();
//   const navigation = useNavigation<LocationPickerScreenNavigationProp>();
  
//   const [currentLocation, setCurrentLocation] = useState({
//     latitude: 28.6139,
//     longitude: 77.2090,
//     latitudeDelta: 0.01,
//     longitudeDelta: 0.01,
//   });

//   const [selectedLocation, setSelectedLocation] = useState({
//     latitude: 28.6139,
//     longitude: 77.2090,
//     address: 'Green Park Colony, New Delhi, Delhi 110016',
//     pincode: '110016',
//   });

//   const [isLoading, setIsLoading] = useState(false);
//   const [hasLocationPermission, setHasLocationPermission] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState<any[]>([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
//   const [is3DEnabled, setIs3DEnabled] = useState(false);
//   const [mapError, setMapError] = useState<string | null>(null);
//   const [isMapLoading, setIsMapLoading] = useState(true);
//   const [useFallbackMap, setUseFallbackMap] = useState(false);

//   useEffect(() => {
//     getCurrentLocation();
    
//     // Set timeout for map loading
//     const mapTimeout = setTimeout(() => {
//       console.log('🗺️ Map loading timeout - switching to fallback');
//       setUseFallbackMap(true);
//       setIsMapLoading(false);
//     }, 10000); // 2 seconds timeout - more aggressive

//     return () => {
//       clearTimeout(mapTimeout);
//       // Clean up any MapView references
//       setMapError(null);
//       setIsMapLoading(false);
//     };
//   }, [isMapLoading]);

//   const getCurrentLocation = async () => {
//     setIsLoading(true);
//     try {
//       // Request location permission
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       setHasLocationPermission(status === 'granted');
      
//       if (status === 'granted') {
//         // Get current location
//         const location = await Location.getCurrentPositionAsync({
//           accuracy: Location.Accuracy.High,
//         });
        
//         const { latitude, longitude } = location.coords;
        
//         // Reverse geocode to get address using Google Maps
//         const addressResult = await googleMapsService.reverseGeocode(latitude, longitude);
        
//         let address = 'Current Location';
//         if (addressResult) {
//           address = addressResult.formattedAddress;
//         } else {
//           // Fallback to expo location
//           const addressResponse = await Location.reverseGeocodeAsync({
//             latitude,
//             longitude,
//           });
          
//           address = addressResponse[0] 
//             ? `${addressResponse[0].street}, ${addressResponse[0].city}, ${addressResponse[0].region}`
//             : 'Current Location';
//         }
        
//         setCurrentLocation({
//           latitude,
//           longitude,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         });
        
//         // Extract pincode from address
//         const pincodeMatch = address.match(/\b\d{6}\b/);
//         const pincode = pincodeMatch ? pincodeMatch[0] : '';
        
//         setSelectedLocation({
//           latitude,
//           longitude,
//           address,
//           pincode,
//         });
//       } else {
//         Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Unable to get current location. Using default location.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleMapPress = async (event: any) => {
//     const { latitude, longitude } = event.nativeEvent.coordinate;
    
//     // Get address for selected location using Google Maps
//     const addressResult = await googleMapsService.reverseGeocode(latitude, longitude);
    
//     let address = 'Selected Location';
//     let pincode = '';
//     if (addressResult) {
//       address = addressResult.formattedAddress;
//       // Extract pincode from address (look for 6-digit number)
//       const pincodeMatch = address.match(/\b\d{6}\b/);
//       pincode = pincodeMatch ? pincodeMatch[0] : '';
//     }
    
//     setSelectedLocation({
//       latitude,
//       longitude,
//       address,
//       pincode,
//     });
//   };

//   const handleUseCurrentLocation = () => {
//     if (!hasLocationPermission) {
//       Alert.alert('Permission Required', 'Location permission is required to use current location.');
//       return;
//     }
//     setSelectedLocation({
//       latitude: currentLocation.latitude,
//       longitude: currentLocation.longitude,
//       address: 'Current Location',
//       pincode: '',
//     });
//   };

//   const handleSearch = async (query: string) => {
//     if (query.length < 3) {
//       setSearchResults([]);
//       return;
//     }

//     setIsSearching(true);
//     try {
//       const results = await googleMapsService.searchPlaces(query);
//       setSearchResults(results);
//     } catch (error) {
//       console.error('Search error:', error);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const handleSelectSearchResult = async (place: any) => {
//     const placeDetails = await googleMapsService.getPlaceDetails(place.place_id);
//     if (placeDetails) {
//       const { lat, lng } = placeDetails.geometry.location;
//       // Extract pincode from address
//       const pincodeMatch = placeDetails.formatted_address.match(/\b\d{6}\b/);
//       const pincode = pincodeMatch ? pincodeMatch[0] : '';
      
//       setSelectedLocation({
//         latitude: lat,
//         longitude: lng,
//         address: placeDetails.formatted_address,
//         pincode,
//       });
//       setCurrentLocation({
//         latitude: lat,
//         longitude: lng,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       });
//       setSearchQuery('');
//       setSearchResults([]);
//     }
//   };

//   const handleConfirmLocation = () => {
//     // Check if we came from PincodeScreen (no specific route params)
//     // If so, navigate back to StoreList with the selected location
//     navigation.navigate('StoreList' as any, {
//       latitude: selectedLocation.latitude,
//       longitude: selectedLocation.longitude,
//       address: selectedLocation.address
//     });
//   };

//   const testGoogleMapsAPI = async () => {
//     try {
//       console.log('🧪 Testing Google Maps API...');
//       console.log('🧪 API Key:', API_CONFIG.GOOGLE_MAPS.API_KEY);
      
//       const response = await fetch(
//         `https://maps.googleapis.com/maps/api/geocode/json?address=Delhi,India&key=${API_CONFIG.GOOGLE_MAPS.API_KEY}`
//       );
//       const data = await response.json();
//       console.log('🧪 Google Maps API Test Result:', data);
      
//       if (data.status === 'OK') {
//         Alert.alert(' Google Maps API', 'API is working correctly!');
//       } else {
//         Alert.alert('  Google Maps API', `API Error: ${data.status} - ${data.error_message || 'Unknown error'}`);
//       }
//     } catch (error) {
//       console.error('🧪 Google Maps API Test Error:', error);
//       Alert.alert('  Google Maps API', `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   };

//   const styles = StyleSheet.create({
//     safeArea: {
//       flex: 1,
//       backgroundColor: theme.colors.background,
//     },
//     container: {
//       flex: 1,
//     },
//     header: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       paddingHorizontal: 16,
//       paddingVertical: 12,
//       backgroundColor: theme.colors.surface,
//       borderBottomWidth: 1,
//       borderBottomColor: theme.colors.border,
//     },
//     backButton: {
//       padding: 8,
//       borderRadius: 20,
//       backgroundColor: theme.colors.background,
//       marginRight: 16,
//     },
//     headerTitle: {
//       fontSize: 18,
//       fontWeight: 'bold',
//       color: theme.colors.text,
//     },
//     mapContainer: {
//       flex: 1,
//       backgroundColor: '#f0f0f0',
//       borderWidth: 1,
//       borderColor: '#00ff00',
//     },
//     map: {
//       width: '100%',
//       height: '100%',
//       flex: 1,
//       zIndex: 1,
//       backgroundColor: '#e0e0e0',
//       borderWidth: 2,
//       borderColor: '#ff0000',
//     },
//     footer: {
//       position: 'absolute',
//       bottom: 0,
//       left: 0,
//       right: 0,
//       backgroundColor: theme.colors.surface,
//       padding: 16,
//       borderTopWidth: 1,
//       borderTopColor: theme.colors.border,
//     },
//     locationInfo: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       marginBottom: 16,
//     },
//     locationText: {
//       flex: 1,
//       fontSize: 14,
//       color: theme.colors.text,
//       marginLeft: 8,
//     },
//     changeButton: {
//       paddingHorizontal: 12,
//       paddingVertical: 6,
//       backgroundColor: theme.colors.primary,
//       borderRadius: 6,
//     },
//     changeButtonText: {
//       color: theme.colors.surface,
//       fontSize: 12,
//       fontWeight: '600',
//     },
//     confirmButton: {
//       backgroundColor: theme.colors.primary,
//       paddingVertical: 16,
//       borderRadius: 12,
//       alignItems: 'center',
//     },
//     confirmButtonText: {
//       color: theme.colors.surface,
//       fontSize: 16,
//       fontWeight: 'bold',
//     },
//     useCurrentLocationButton: {
//       position: 'absolute',
//       top: 20,
//       right: 20,
//       backgroundColor: theme.colors.surface,
//       padding: 12,
//       borderRadius: 8,
//       flexDirection: 'row',
//       alignItems: 'center',
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.1,
//       shadowRadius: 4,
//       elevation: 3,
//     },
//     useCurrentLocationText: {
//       marginLeft: 8,
//       fontSize: 14,
//       color: theme.colors.text,
//       fontWeight: '600',
//     },
//     loadingOverlay: {
//       position: 'absolute',
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       backgroundColor: 'rgba(0,0,0,0.5)',
//       alignItems: 'center',
//       justifyContent: 'center',
//     },
//     loadingText: {
//       color: theme.colors.surface,
//       fontSize: 16,
//       marginTop: 16,
//     },
//     searchContainer: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       paddingHorizontal: 16,
//       paddingVertical: 12,
//       backgroundColor: theme.colors.surface,
//       borderBottomWidth: 1,
//       borderBottomColor: theme.colors.border,
//     },
//     searchInput: {
//       flex: 1,
//       height: 40,
//       borderWidth: 1,
//       borderColor: theme.colors.border,
//       borderRadius: 20,
//       paddingHorizontal: 16,
//       marginRight: 12,
//       fontSize: 16,
//       color: theme.colors.text,
//       backgroundColor: theme.colors.background,
//     },
//     searchResultsContainer: {
//       position: 'absolute',
//       top: 100,
//       left: 16,
//       right: 16,
//       backgroundColor: theme.colors.surface,
//       borderRadius: 8,
//       borderWidth: 1,
//       borderColor: theme.colors.border,
//       maxHeight: 200,
//       zIndex: 1000,
//     },
//     searchResultsList: {
//       maxHeight: 200,
//     },
//     searchResultItem: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       paddingHorizontal: 16,
//       paddingVertical: 12,
//       borderBottomWidth: 1,
//       borderBottomColor: theme.colors.border,
//     },
//     searchResultText: {
//       flex: 1,
//       marginLeft: 12,
//     },
//     searchResultName: {
//       fontSize: 16,
//       fontWeight: '600',
//       color: theme.colors.text,
//     },
//     searchResultAddress: {
//       fontSize: 14,
//       color: theme.colors.secondary,
//       marginTop: 2,
//     },
//     mapControlsContainer: {
//       position: 'absolute',
//       top: 20,
//       left: 20,
//       flexDirection: 'column',
//       gap: 8,
//     },
//     mapControlButton: {
//       width: 48,
//       height: 48,
//       borderRadius: 24,
//       backgroundColor: theme.colors.surface,
//       alignItems: 'center',
//       justifyContent: 'center',
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.1,
//       shadowRadius: 4,
//       elevation: 3,
//       borderWidth: 1,
//       borderColor: theme.colors.border,
//     },
//     mapControlButtonActive: {
//       backgroundColor: theme.colors.primary,
//       borderColor: theme.colors.primary,
//     },
//     mapErrorContainer: {
//       flex: 1,
//       alignItems: 'center',
//       justifyContent: 'center',
//       padding: 20,
//       backgroundColor: theme.colors.background,
//     },
//     mapErrorText: {
//       fontSize: 16,
//       color: theme.colors.text,
//       textAlign: 'center',
//       marginTop: 16,
//       marginBottom: 20,
//     },
//     retryButton: {
//       backgroundColor: theme.colors.primary,
//       paddingHorizontal: 24,
//       paddingVertical: 12,
//       borderRadius: 8,
//     },
//     retryButtonText: {
//       color: theme.colors.surface,
//       fontSize: 16,
//       fontWeight: '600',
//     },
//     testButton: {
//       backgroundColor: theme.colors.secondary,
//       paddingHorizontal: 24,
//       paddingVertical: 12,
//       borderRadius: 8,
//       marginTop: 12,
//     },
//     testButtonText: {
//       color: theme.colors.surface,
//       fontSize: 16,
//       fontWeight: '600',
//     },
//     mapWrapper: {
//       flex: 1,
//       position: 'relative',
//       width: '100%',
//       height: '100%',
//     },
//     mapLoadingOverlay: {
//       position: 'absolute',
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       backgroundColor: theme.colors.background,
//       justifyContent: 'center',
//       alignItems: 'center',
//       zIndex: 10,
//     },
//     mapLoadingText: {
//       marginTop: 12,
//       fontSize: 16,
//       color: theme.colors.text,
//       fontWeight: '500',
//     },
//     forceFallbackButton: {
//       backgroundColor: theme.colors.secondary,
//       paddingHorizontal: 20,
//       paddingVertical: 12,
//       borderRadius: 8,
//       marginTop: 16,
//     },
//     forceFallbackText: {
//       color: theme.colors.surface,
//       fontSize: 14,
//       fontWeight: '600',
//     },
//     fallbackMapContainer: {
//       flex: 1,
//       backgroundColor: theme.colors.surface,
//       padding: 20,
//       justifyContent: 'center',
//       alignItems: 'center',
//     },
//     fallbackMapHeader: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       marginBottom: 20,
//     },
//     fallbackMapTitle: {
//       fontSize: 18,
//       fontWeight: 'bold',
//       color: theme.colors.text,
//       marginLeft: 8,
//     },
//     coordinateDisplay: {
//       backgroundColor: theme.colors.background,
//       padding: 16,
//       borderRadius: 8,
//       marginBottom: 20,
//       width: '100%',
//     },
//     coordinateLabel: {
//       fontSize: 14,
//       color: theme.colors.text,
//       marginBottom: 4,
//       fontFamily: 'monospace',
//     },
//     fallbackMapButtons: {
//       flexDirection: 'row',
//       flexWrap: 'wrap',
//       justifyContent: 'center',
//       marginBottom: 20,
//     },
//     coordinateButton: {
//       backgroundColor: theme.colors.primary,
//       paddingHorizontal: 16,
//       paddingVertical: 12,
//       borderRadius: 8,
//       margin: 4,
//       minWidth: 80,
//     },
//     coordinateButtonText: {
//       color: theme.colors.surface,
//       fontSize: 14,
//       fontWeight: '600',
//       textAlign: 'center',
//     },
//     tryMapAgainButton: {
//       backgroundColor: theme.colors.secondary,
//       paddingHorizontal: 24,
//       paddingVertical: 12,
//       borderRadius: 8,
//     },
//     tryMapAgainText: {
//       color: theme.colors.surface,
//       fontSize: 16,
//       fontWeight: '600',
//     },
//     debugContainer: {
//       backgroundColor: theme.colors.surface,
//       padding: 8,
//       marginHorizontal: 16,
//       borderRadius: 4,
//       marginBottom: 8,
//     },
//     debugText: {
//       fontSize: 12,
//       color: theme.colors.text,
//       fontFamily: 'monospace',
//     },
//     quickFallbackButton: {
//       backgroundColor: theme.colors.primary,
//       paddingHorizontal: 16,
//       paddingVertical: 8,
//       borderRadius: 6,
//       marginTop: 8,
//       alignSelf: 'center',
//     },
//     quickFallbackText: {
//       color: theme.colors.surface,
//       fontSize: 12,
//       fontWeight: '600',
//     },
//   });

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.container}>
//         <View style={styles.header}>
//           <TouchableOpacity
//             onPress={() => navigation.goBack()}
//             style={styles.backButton}
//           >
//             <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Select Location</Text>
//         </View>
        
//         {/* Debug Info */}
//         <View style={styles.debugContainer}>
//           <Text style={styles.debugText}>
//             Map Loading: {isMapLoading ? 'Yes' : 'No'} | 
//             Fallback: {useFallbackMap ? 'Yes' : 'No'} | 
//             Error: {mapError ? 'Yes' : 'No'}
//           </Text>
//           <Text style={styles.debugText}>
//             Current Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
//           </Text>
//           <TouchableOpacity 
//             style={styles.quickFallbackButton}
//             onPress={() => {
//               setUseFallbackMap(true);
//               setIsMapLoading(false);
//             }}
//           >
//             <Text style={styles.quickFallbackText}>Use Coordinate Selector</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Search Bar */}
//         <View style={styles.searchContainer}>
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search for a place..."
//             value={searchQuery}
//             onChangeText={(text) => {
//               setSearchQuery(text);
//               handleSearch(text);
//             }}
//             placeholderTextColor={theme.colors.secondary}
//           />
//           <MaterialIcons name="search" size={24} color={theme.colors.primary} />
//         </View>

//         {/* Search Results */}
//         {searchResults.length > 0 && (
//           <View style={styles.searchResultsContainer}>
//             <FlatList
//               data={searchResults}
//               keyExtractor={(item) => item.place_id}
//               renderItem={({ item }) => (
//                 <TouchableOpacity
//                   style={styles.searchResultItem}
//                   onPress={() => handleSelectSearchResult(item)}
//                 >
//                   <MaterialIcons name="location-on" size={20} color={theme.colors.primary} />
//                   <View style={styles.searchResultText}>
//                     <Text style={styles.searchResultName} numberOfLines={1}>
//                       {item.name}
//                     </Text>
//                     <Text style={styles.searchResultAddress} numberOfLines={1}>
//                       {item.formatted_address}
//                     </Text>
//                   </View>
//                 </TouchableOpacity>
//               )}
//               style={styles.searchResultsList}
//             />
//           </View>
//         )}

//         <View style={styles.mapContainer}>
//           {mapError ? (
//             <View style={styles.mapErrorContainer}>
//               <MaterialIcons name="error-outline" size={48} color={theme.colors.error} />
//               <Text style={styles.mapErrorText}>{mapError}</Text>
//               <TouchableOpacity
//                 style={styles.retryButton}
//                 onPress={() => {
//                   setMapError(null);
//                   setIsMapLoading(true);
//                   getCurrentLocation();
//                 }}
//               >
//                 <Text style={styles.retryButtonText}>Retry</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.testButton} onPress={testGoogleMapsAPI}>
//                 <Text style={styles.testButtonText}>Test API Key</Text>
//               </TouchableOpacity>
//               <TouchableOpacity 
//                 style={[styles.testButton, { backgroundColor: theme.colors.secondary, marginTop: 8 }]} 
//                 onPress={() => {
//                   setUseFallbackMap(true);
//                   setIsMapLoading(false);
//                 }}
//               >
//                 <Text style={styles.testButtonText}>Use Coordinate Selector</Text>
//               </TouchableOpacity>
//             </View>
//           ) : (
//             <View style={styles.mapWrapper}>
//               {isMapLoading && !useFallbackMap && (
//                 <View style={styles.mapLoadingOverlay}>
//                   <MaterialIcons name="refresh" size={32} color={theme.colors.primary} />
//                   <Text style={styles.mapLoadingText}>Loading Map...</Text>
//                   <TouchableOpacity 
//                     style={styles.forceFallbackButton}
//                     onPress={() => {
//                       setUseFallbackMap(true);
//                       setIsMapLoading(false);
//                     }}
//                   >
//                     <Text style={styles.forceFallbackText}>Use Coordinate Selector Instead</Text>
//                   </TouchableOpacity>
//                 </View>
//               )}
              
//               {useFallbackMap ? (
//                 <View style={styles.fallbackMapContainer}>
//                   <View style={styles.fallbackMapHeader}>
//                     <MaterialIcons name="map" size={24} color={theme.colors.primary} />
//                     <Text style={styles.fallbackMapTitle}>Location Selector</Text>
//                   </View>
//                   <View style={styles.coordinateDisplay}>
//                     <Text style={styles.coordinateLabel}>Latitude: {selectedLocation.latitude.toFixed(6)}</Text>
//                     <Text style={styles.coordinateLabel}>Longitude: {selectedLocation.longitude.toFixed(6)}</Text>
//                   </View>
//                   <View style={styles.fallbackMapButtons}>
//                     <TouchableOpacity 
//                       style={styles.coordinateButton}
//                       onPress={() => {
//                         const newLat = selectedLocation.latitude + 0.001;
//                         setSelectedLocation({...selectedLocation, latitude: newLat});
//                       }}
//                     >
//                       <Text style={styles.coordinateButtonText}>↑ North</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity 
//                       style={styles.coordinateButton}
//                       onPress={() => {
//                         const newLat = selectedLocation.latitude - 0.001;
//                         setSelectedLocation({...selectedLocation, latitude: newLat});
//                       }}
//                     >
//                       <Text style={styles.coordinateButtonText}>↓ South</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity 
//                       style={styles.coordinateButton}
//                       onPress={() => {
//                         const newLng = selectedLocation.longitude + 0.001;
//                         setSelectedLocation({...selectedLocation, longitude: newLng});
//                       }}
//                     >
//                       <Text style={styles.coordinateButtonText}>→ East</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity 
//                       style={styles.coordinateButton}
//                       onPress={() => {
//                         const newLng = selectedLocation.longitude - 0.001;
//                         setSelectedLocation({...selectedLocation, longitude: newLng});
//                       }}
//                     >
//                       <Text style={styles.coordinateButtonText}>← West</Text>
//                     </TouchableOpacity>
//                   </View>
//                   <TouchableOpacity 
//                     style={styles.tryMapAgainButton}
//                     onPress={() => {
//                       setUseFallbackMap(false);
//                       setIsMapLoading(true);
//                     }}
//                   >
//                     <Text style={styles.tryMapAgainText}>Try Map Again</Text>
//                   </TouchableOpacity>
//                 </View>
//               ) : !mapError ? (
//             <MapView
//             key={`map-${useFallbackMap ? 'fallback' : 'main'}`}
//             style={styles.map}
//             initialRegion={currentLocation}
//             onPress={handleMapPress}
//             mapType={mapType}
//             // provider="google"
//             showsUserLocation={true}
//             loadingEnabled={true}
//             onMapReady={() => {
//               console.log('🗺️ Map is ready');
//               setMapError(null);
//               setIsMapLoading(false);
//             }}
//           >
//             <Marker
//               coordinate={{
//                 latitude: selectedLocation.latitude,
//                 longitude: selectedLocation.longitude,
//               }}
//               title="Selected Location"
//               description={selectedLocation.address}
//               pinColor={theme.colors.primary}
//               draggable={true}
//               onDragEnd={(event) => {
//                 const { latitude, longitude } = event.nativeEvent.coordinate;
//                 handleMapPress({ nativeEvent: { coordinate: { latitude, longitude } } });
//               }}
//             />
//           </MapView>
//               ) : (
//                 <View style={styles.fallbackMapContainer}>
//                   <View style={styles.fallbackMapHeader}>
//                     <MaterialIcons name="error" size={24} color={theme.colors.error} />
//                     <Text style={styles.fallbackMapTitle}>Map Error</Text>
//                   </View>
//                   <Text style={styles.coordinateLabel}>Map failed to load. Using coordinate selector instead.</Text>
//                   <TouchableOpacity 
//                     style={styles.tryMapAgainButton}
//                     onPress={() => {
//                       setMapError(null);
//                       setIsMapLoading(true);
//                     }}
//                   >
//                     <Text style={styles.tryMapAgainText}>Try Map Again</Text>
//                   </TouchableOpacity>
//                 </View>
//               )}
//             </View>
//           )}

//           <TouchableOpacity
//             style={styles.useCurrentLocationButton}
//             onPress={handleUseCurrentLocation}
//           >
//             <MaterialIcons name="my-location" size={20} color={theme.colors.primary} />
//             <Text style={styles.useCurrentLocationText}>Use Current Location</Text>
//           </TouchableOpacity>

//           {/* Map Controls */}
//           <View style={styles.mapControlsContainer}>
//             <TouchableOpacity
//               style={[styles.mapControlButton, mapType === 'standard' && styles.mapControlButtonActive]}
//               onPress={() => setMapType('standard')}
//             >
//               <MaterialIcons name="map" size={20} color={theme.colors.primary} />
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[styles.mapControlButton, mapType === 'satellite' && styles.mapControlButtonActive]}
//               onPress={() => setMapType('satellite')}
//             >
//               <MaterialIcons name="satellite" size={20} color={theme.colors.primary} />
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[styles.mapControlButton, mapType === 'hybrid' && styles.mapControlButtonActive]}
//               onPress={() => setMapType('hybrid')}
//             >
//               <MaterialIcons name="layers" size={20} color={theme.colors.primary} />
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[styles.mapControlButton, is3DEnabled && styles.mapControlButtonActive]}
//               onPress={() => setIs3DEnabled(!is3DEnabled)}
//             >
//               <MaterialIcons name="3d-rotation" size={20} color={theme.colors.primary} />
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={styles.mapControlButton}
//               onPress={testGoogleMapsAPI}
//             >
//               <MaterialIcons name="bug-report" size={20} color={theme.colors.primary} />
//             </TouchableOpacity>
//           </View>

//           {isLoading && (
//             <View style={styles.loadingOverlay}>
//               <MaterialIcons name="location-searching" size={48} color={theme.colors.surface} />
//               <Text style={styles.loadingText}>Getting your location...</Text>
//             </View>
//           )}
//         </View>

//         <View style={styles.footer}>
//           <View style={styles.locationInfo}>
//             <MaterialIcons name="location-on" size={20} color={theme.colors.primary} />
//             <Text style={styles.locationText} numberOfLines={2}>
//               {selectedLocation.address}
//               {selectedLocation.pincode && ` (Pincode: ${selectedLocation.pincode})`}
//             </Text>
//             <TouchableOpacity style={styles.changeButton}>
//               <Text style={styles.changeButtonText}>Change</Text>
//             </TouchableOpacity>
//           </View>

//           <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
//             <Text style={styles.confirmButtonText}>Select This Location</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default LocationPickerScreen; 


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
  FlatList,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { googleMapsService, ReverseGeocodeResult } from '../../services/api/googleMapsService';
import { API_CONFIG } from '../../services/api/config';

type LocationPickerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LocationPicker'>;

const { width, height } = Dimensions.get('window');

const LocationPickerScreen = () => {
  const { theme, section } = useTheme();
  const navigation = useNavigation<LocationPickerScreenNavigationProp>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // Check if this is being used for address creation
  const isForAddressCreation = (route.params as any)?.forAddress === true;
  
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    address: 'Green Park Colony, New Delhi, Delhi 110016',
    pincode: '110016',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [useFallbackMap, setUseFallbackMap] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Initialize location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Set timeout for map loading (only if map isn't ready)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapReady && !useFallbackMap) {
        console.log('🗺️ Map loading timeout - switching to fallback');
        setUseFallbackMap(true);
        setIsMapLoading(false);
      }
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timer);
  }, [mapReady, useFallbackMap]);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const { latitude, longitude } = location.coords;
        
        // Reverse geocode to get address using Google Maps
        const addressResult = await googleMapsService.reverseGeocode(latitude, longitude);
        
        let address = 'Current Location';
        if (addressResult) {
          address = addressResult.formattedAddress;
        } else {
          // Fallback to expo location
          const addressResponse = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });
          
          address = addressResponse[0] 
            ? `${addressResponse[0].street}, ${addressResponse[0].city}, ${addressResponse[0].region}`
            : 'Current Location';
        }
        
        setCurrentLocation({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        
        // Extract pincode from address
        const pincodeMatch = address.match(/\b\d{6}\b/);
        const pincode = pincodeMatch ? pincodeMatch[0] : '';
        
        setSelectedLocation({
          latitude,
          longitude,
          address,
          pincode,
        });
      } else {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Unable to get current location. Using default location.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    // Get address for selected location using Google Maps
    const addressResult = await googleMapsService.reverseGeocode(latitude, longitude);
    
    let address = 'Selected Location';
    let pincode = '';
    if (addressResult) {
      address = addressResult.formattedAddress;
      // Extract pincode from address (look for 6-digit number)
      const pincodeMatch = address.match(/\b\d{6}\b/);
      pincode = pincodeMatch ? pincodeMatch[0] : '';
    }
    
    setSelectedLocation({
      latitude,
      longitude,
      address,
      pincode,
    });
  };

  const handleUseCurrentLocation = () => {
    if (!hasLocationPermission) {
      Alert.alert('Permission Required', 'Location permission is required to use current location.');
      return;
    }
    setSelectedLocation({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      address: 'Current Location',
      pincode: '',
    });
  };

  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await googleMapsService.searchPlaces(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = async (place: any) => {
    const placeDetails = await googleMapsService.getPlaceDetails(place.place_id);
    if (placeDetails) {
      const { lat, lng } = placeDetails.geometry.location;
      // Extract pincode from address
      const pincodeMatch = placeDetails.formatted_address.match(/\b\d{6}\b/);
      const pincode = pincodeMatch ? pincodeMatch[0] : '';
      
      setSelectedLocation({
        latitude: lat,
        longitude: lng,
        address: placeDetails.formatted_address,
        pincode,
      });
      setCurrentLocation({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleConfirmLocation = () => {
    if (isForAddressCreation) {
      // Navigate to AddAddress with location data
      navigation.navigate('AddAddress' as any, {
        location: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: selectedLocation.address
        }
      });
    } else {
      // Navigate to StoreList for store selection
      navigation.navigate('StoreList' as any, {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: selectedLocation.address,
        storeType: section,
      });
    }
  };

  const testGoogleMapsAPI = async () => {
    try {
      console.log('🧪 Testing Google Maps API...');
      console.log('🧪 API Key:', API_CONFIG.GOOGLE_MAPS.API_KEY);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=Delhi,India&key=${API_CONFIG.GOOGLE_MAPS.API_KEY}`
      );
      const data = await response.json();
      console.log('🧪 Google Maps API Test Result:', data);
      
      if (data.status === 'OK') {
        Alert.alert(' Google Maps API', 'API is working correctly!');
      } else {
        Alert.alert('  Google Maps API', `API Error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('🧪 Google Maps API Test Error:', error);
      Alert.alert('  Google Maps API', `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      marginTop: 8,
    },
    mapContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      minHeight: 300,
    },
    map: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    footer: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      paddingBottom: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    locationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    locationText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: 8,
    },
    changeButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.primary,
      borderRadius: 6,
    },
    changeButtonText: {
      color: theme.colors.surface,
      fontSize: 12,
      fontWeight: '600',
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: -10,
    },
    confirmButtonText: {
      color: theme.colors.surface,
      fontSize: 16,
      fontWeight: 'bold',
    },
    useCurrentLocationButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    useCurrentLocationText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '600',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    loadingText: {
      color: theme.colors.surface,
      fontSize: 16,
      marginTop: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      marginRight: 12,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    searchResultsContainer: {
      position: 'absolute',
      top: 100,
      left: 16,
      right: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      maxHeight: 200,
      zIndex: 1000,
    },
    searchResultsList: {
      maxHeight: 200,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchResultText: {
      flex: 1,
      marginLeft: 12,
    },
    searchResultName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    searchResultAddress: {
      fontSize: 14,
      color: theme.colors.secondary,
      marginTop: 2,
    },
    mapControlsContainer: {
      position: 'absolute',
      top: 20,
      left: 20,
      flexDirection: 'column',
      gap: 8,
    },
    mapControlButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    mapControlButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    mapErrorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    mapErrorText: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: theme.colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
    testButton: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 12,
    },
    testButtonText: {
      color: theme.colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
    mapWrapper: {
      flex: 1,
      position: 'relative',
    },
    mapLoadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    mapLoadingText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    forceFallbackButton: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 16,
    },
    forceFallbackText: {
      color: theme.colors.surface,
      fontSize: 14,
      fontWeight: '600',
    },
    fallbackMapContainer: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      padding: 20,
      minHeight: 300,
    },
    fallbackMapScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 20,
    },
    fallbackMapHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    fallbackMapTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginLeft: 8,
    },
    coordinateDisplay: {
      backgroundColor: theme.colors.background,
      padding: 16,
      borderRadius: 8,
      marginBottom: 20,
      width: '100%',
    },
    coordinateLabel: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 4,
      fontFamily: 'monospace',
    },
    fallbackMapButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 20,
    },
    coordinateButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      margin: 4,
      minWidth: 80,
    },
    coordinateButtonText: {
      color: theme.colors.surface,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    tryMapAgainButton: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    tryMapAgainText: {
      color: theme.colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a place..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
            placeholderTextColor={theme.colors.secondary}
          />
          <MaterialIcons name="search" size={24} color={theme.colors.primary} />
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => handleSelectSearchResult(item)}
                >
                  <MaterialIcons name="location-on" size={20} color={theme.colors.primary} />
                  <View style={styles.searchResultText}>
                    <Text style={styles.searchResultName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.searchResultAddress} numberOfLines={1}>
                      {item.formatted_address}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.searchResultsList}
            />
          </View>
        )}

        {/* Map Container */}
        <View style={styles.mapContainer}>
          {mapError ? (
            // Map Error State
            <View style={styles.mapErrorContainer}>
              <MaterialIcons name="error-outline" size={48} color={theme.colors.error} />
              <Text style={styles.mapErrorText}>{mapError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setMapError(null);
                  setIsMapLoading(true);
                  setMapReady(false);
                  getCurrentLocation();
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.testButton} onPress={testGoogleMapsAPI}>
                <Text style={styles.testButtonText}>Test API Key</Text>
              </TouchableOpacity>
            </View>
          ) : useFallbackMap ? (
            // Fallback Coordinate Selector
            <View style={styles.fallbackMapContainer}>
              <View style={styles.fallbackMapHeader}>
                <MaterialIcons name="map" size={24} color={theme.colors.primary} />
                <Text style={styles.fallbackMapTitle}>Location Selector</Text>
              </View>
              <View style={styles.coordinateDisplay}>
                <Text style={styles.coordinateLabel}>
                  Latitude: {selectedLocation.latitude.toFixed(6)}
                </Text>
                <Text style={styles.coordinateLabel}>
                  Longitude: {selectedLocation.longitude.toFixed(6)}
                </Text>
                <Text style={styles.coordinateLabel}>
                  Address: {selectedLocation.address}
                </Text>
              </View>
              <View style={styles.fallbackMapButtons}>
                <TouchableOpacity 
                  style={styles.coordinateButton}
                  onPress={() => {
                    const newLat = selectedLocation.latitude + 0.001;
                    setSelectedLocation({...selectedLocation, latitude: newLat});
                  }}
                >
                  <Text style={styles.coordinateButtonText}>↑ North</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.coordinateButton}
                  onPress={() => {
                    const newLat = selectedLocation.latitude - 0.001;
                    setSelectedLocation({...selectedLocation, latitude: newLat});
                  }}
                >
                  <Text style={styles.coordinateButtonText}>↓ South</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.coordinateButton}
                  onPress={() => {
                    const newLng = selectedLocation.longitude + 0.001;
                    setSelectedLocation({...selectedLocation, longitude: newLng});
                  }}
                >
                  <Text style={styles.coordinateButtonText}>→ East</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.coordinateButton}
                  onPress={() => {
                    const newLng = selectedLocation.longitude - 0.001;
                    setSelectedLocation({...selectedLocation, longitude: newLng});
                  }}
                >
                  <Text style={styles.coordinateButtonText}>← West</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={styles.tryMapAgainButton}
                onPress={() => {
                  setUseFallbackMap(false);
                  setIsMapLoading(true);
                  setMapReady(false);
                  setMapError(null);
                }}
              >
                <Text style={styles.tryMapAgainText}>Try Map Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Main Map View
            <View style={styles.mapWrapper}>
              {/* Loading Overlay - only show while loading and map not ready */}
              {isMapLoading && !mapReady && (
                <View style={styles.mapLoadingOverlay}>
                  <MaterialIcons name="refresh" size={32} color={theme.colors.primary} />
                  <Text style={styles.mapLoadingText}>Loading Map...</Text>
                  <TouchableOpacity 
                    style={styles.forceFallbackButton}
                    onPress={() => {
                      setUseFallbackMap(true);
                      setIsMapLoading(false);
                    }}
                  >
                    <Text style={styles.forceFallbackText}>Use Coordinate Selector Instead</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Google Maps */}
              <MapView
                style={styles.map}
                initialRegion={currentLocation}
                region={currentLocation}
                onPress={handleMapPress}
                mapType={mapType}
                provider="google"
                showsUserLocation={hasLocationPermission}
                showsMyLocationButton={false}
                onMapReady={() => {
                  console.log('🗺️ Map is ready!');
                  setMapReady(true);
                  setIsMapLoading(false);
                  setMapError(null);
                }}
              >
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  title="Selected Location"
                  description={selectedLocation.address}
                  draggable={true}
                  onDragEnd={(event) => {
                    const { latitude, longitude } = event.nativeEvent.coordinate;
                    handleMapPress({ nativeEvent: { coordinate: { latitude, longitude } } });
                  }}
                />
              </MapView>

              {/* Use Current Location Button */}
              <TouchableOpacity
                style={styles.useCurrentLocationButton}
                onPress={handleUseCurrentLocation}
              >
                <MaterialIcons name="my-location" size={20} color={theme.colors.primary} />
                <Text style={styles.useCurrentLocationText}>Current</Text>
              </TouchableOpacity>

              {/* Map Controls */}
              <View style={styles.mapControlsContainer}>
                <TouchableOpacity
                  style={[styles.mapControlButton, mapType === 'standard' && styles.mapControlButtonActive]}
                  onPress={() => setMapType('standard')}
                >
                  <MaterialIcons 
                    name="map" 
                    size={20} 
                    color={mapType === 'standard' ? theme.colors.surface : theme.colors.primary} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.mapControlButton, mapType === 'satellite' && styles.mapControlButtonActive]}
                  onPress={() => setMapType('satellite')}
                >
                  <MaterialIcons 
                    name="satellite" 
                    size={20} 
                    color={mapType === 'satellite' ? theme.colors.surface : theme.colors.primary} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.mapControlButton}
                  onPress={testGoogleMapsAPI}
                >
                  <MaterialIcons name="bug-report" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Global Loading Overlay for location fetching */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <MaterialIcons name="location-searching" size={48} color={theme.colors.surface} />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.locationInfo}>
            <MaterialIcons name="location-on" size={20} color={theme.colors.primary} />
            <Text style={styles.locationText} numberOfLines={2}>
              {selectedLocation.address}
              {selectedLocation.pincode && ` (${selectedLocation.pincode})`}
            </Text>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
            <Text style={styles.confirmButtonText}>Select This Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LocationPickerScreen;