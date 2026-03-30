// // import React, { useEffect, useRef, useState } from 'react';
// // import {
// //   View,
// //   Image,
// //   StyleSheet,
// //   Dimensions,
// //   TouchableOpacity,
// //   FlatList,
// //   ActivityIndicator,
// // } from 'react-native';
// // import { useNavigation } from '@react-navigation/native';
// // import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// // import { RootStackParamList } from '../../navigation/types';
// // import { useAppContext } from '../../contexts/AppContext';
// // import { margBannerService } from '../../services/api/margBannerService';

// // type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// // interface Banner {
// //   id: string;
// //   image: string;
// //   // link: string;
// // }

// // // Fallback banners data
// // // I want to use different banner images for grocery store and pharmacy stores
// // const fallbackBanners: Banner[] = [
// //   {
// //     id: '1',
// //     image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
// //     // link: 'banner1',
// //   },
// //   {
// //     id: '2',
// //     image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
// //     // link: 'banner2',
// //   },
// //   {
// //     id: '3',
// //     image: 'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
// //     // link: 'banner3',
// //   },
// // ];

// // const fallbackPharmacyBanners: Banner[] = [
// //   {
// //     id: '1',
// //     image: 'https://i.ibb.co/DHSpgQXh/file-00000000002471fa9e5bed97c53bd2ce.png',
// //     // link: 'pharmacy_banner1',
// //   },
// //   {
// //     id: '2',
// //     image: 'https://i.ibb.co/0RkqZyJq/file-000000007a9871faa17809e455b6bf0f.png',
// //     // link: 'pharmacy_banner2',
// //   },
// //   {
// //     id: '3',
// //     image: 'https://i.ibb.co/20JWjY0k/file-000000000df471fab228d900b1f3c2ae.png',
// //     // link: 'pharmacy_banner3',
// //   },
// //   // {
// //   //   id: '4',
// //   //   image: 'https://i.ibb.co/LzyTrVH2/file-000000006b8c71faa38214040f9f9993.png',
// //   //   // link: 'pharmacy_banner4',
// //   // },
// // ];

// // const { width } = Dimensions.get('window');

// // const BannerSlider = () => {
// //   const navigation = useNavigation<NavigationProp>();
// //   const { selectedStore } = useAppContext();
// //   const flatListRef = useRef<FlatList>(null);
// //   const [currentIndex, setCurrentIndex] = useState(0);
// //   const [banners, setBanners] = useState<Banner[]>([]);
// //   const [loading, setLoading] = useState(false);

// //   // Lazy loading: Fetch banners from MargERP API only - NO FALLBACK
// //   useEffect(() => {
// //     const fetchBanners = async () => {
// //       try {
// //         setLoading(true);
// //         console.log('🔄 Fetching banners from MargERP API');

// //         const response = await margBannerService.getBanners();
// //         if (response.success && response.data && response.data.length > 0) {
// //           console.log('✅ Banners loaded from MargERP API:', response.data.length);
// //           setBanners(response.data);
// //         } else {
// //           console.log('⚠️ MargERP API returned no banners - showing NO banners');
// //           setBanners([]);
// //         }
// //       } catch (error) {
// //         console.error('❌ Error fetching banners from MargERP:', error);
// //         console.log('   Showing NO banners');
// //         setBanners([]);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     // Add a small delay to let the screen render first
// //     const timer = setTimeout(() => {
// //       fetchBanners();
// //     }, 300);

// //     return () => clearTimeout(timer);
// //   }, []);

// //   useEffect(() => {
// //     const interval = setInterval(() => {
// //       if (currentIndex < banners.length - 1) {
// //         flatListRef.current?.scrollToIndex({
// //           index: currentIndex + 1,
// //           animated: true,
// //         });
// //       } else {
// //         flatListRef.current?.scrollToIndex({
// //           index: 0,
// //           animated: true,
// //         });
// //       }
// //     }, 2000);

// //     return () => clearInterval(interval);
// //   }, [currentIndex, banners.length]);

// //   const handleBannerPress = (link: string) => {
// //     navigation.navigate('BannerDetail', { bannerId: link });
// //   };

// //   const renderItem = ({ item }: { item: Banner }) => (
// //     <TouchableOpacity
// //       style={styles.bannerContainer}
// //       // onPress={() => handleBannerPress(item.link)}
// //       activeOpacity={0.9}
// //     >
// //       <Image
// //         source={{ uri: item.image }}
// //         style={styles.bannerImage}
// //         onError={(error) => {
// //           console.error('🖼️ Banner image load error:');
// //           console.error('   Image URI:', item.image?.substring(0, 100));
// //           console.error('   Error:', error.nativeEvent?.error || error);
// //         }}
// //         onLoad={() => {
// //           console.log('✅ Banner image loaded successfully');
// //           console.log('   Image URI:', item.image?.substring(0, 100));
// //         }}
// //       />
// //     </TouchableOpacity>
// //   );

// //   const handleScroll = (event: any) => {
// //     const contentOffset = event.nativeEvent.contentOffset.x;
// //     const index = Math.round(contentOffset / width);
// //     setCurrentIndex(index);
// //   };

// //   // return (
// //   //   <View style={styles.container}>
// //   //     <FlatList
// //   //       ref={flatListRef}
// //   //       data={banners}
// //   //       renderItem={renderItem}
// //   //       keyExtractor={(item) => item.id}
// //   //       horizontal
// //   //       pagingEnabled
// //   //       showsHorizontalScrollIndicator={false}
// //   //       onScroll={handleScroll}
// //   //       scrollEventThrottle={16}
// //   //     />
// //   //     <View style={styles.paginationContainer}>
// //   //       {banners.map((_, index) => (
// //   //         <View
// //   //           key={index}
// //   //           style={[
// //   //             styles.paginationDot,
// //   //             index === currentIndex && styles.paginationDotActive,
// //   //           ]}
// //   //         />
// //   //       ))}
// //   //     </View>
// //   //   </View>
// //   // );

// //   // See update the above return to show different banners for grocery and pharmacy stores
// //   // Show nothing if no banners from API
// //   if (banners.length === 0 && !loading) {
// //     return null;
// //   }

// //   return (
// //     <View style={styles.container}>
// //       {banners.length === 0 && loading ? (
// //         // Show loading indicator when fetching
// //         <View style={styles.loaderContainer}>
// //           <ActivityIndicator size="large" color="#FF6B35" />
// //         </View>
// //       ) : (
// //         <>
// //           <FlatList
// //             ref={flatListRef}
// //             data={banners}
// //             renderItem={renderItem}
// //             keyExtractor={(item) => item.id}
// //             horizontal
// //             pagingEnabled
// //             showsHorizontalScrollIndicator={false}
// //             onScroll={handleScroll}
// //             scrollEventThrottle={16}
// //           />
// //           <View style={styles.paginationContainer}>
// //             {banners.map((_, index) => (
// //               <View
// //                 key={index}
// //                 style={[
// //                   styles.paginationDot,
// //                   index === currentIndex && styles.paginationDotActive,
// //                 ]}
// //               />
// //             ))}
// //           </View>
// //         </>
// //       )}
// //       {loading && banners.length > 0 && (
// //         // Show loader overlay when refetching with existing banners
// //         <View style={styles.loaderOverlay}>
// //           <ActivityIndicator size="large" color="#FF6B35" />
// //         </View>
// //       )}
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     height: 220,
// //     marginVertical: 16,
// //   },
// //   bannerContainer: {
// //     width: width,
// //     height: 220,
// //     paddingHorizontal: 16,
// //   },
// //   bannerImage: {
// //     width: '100%',
// //     height: '100%',
// //     borderRadius: 12,
// //   },
// //   paginationContainer: {
// //     flexDirection: 'row',
// //     position: 'absolute',
// //     bottom: 10,
// //     alignSelf: 'center',
// //   },
// //   paginationDot: {
// //     width: 8,
// //     height: 8,
// //     borderRadius: 4,
// //     backgroundColor: 'rgba(255, 255, 255, 0.5)',
// //     marginHorizontal: 4,
// //   },
// //   paginationDotActive: {
// //     backgroundColor: '#fff',
// //   },
// //   loaderContainer: {
// //     height: 220,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     backgroundColor: '#f5f5f5',
// //     borderRadius: 12,
// //     marginHorizontal: 16,
// //   },
// //   loaderOverlay: {
// //     ...StyleSheet.absoluteFillObject,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     backgroundColor: 'rgba(0, 0, 0, 0.3)',
// //     borderRadius: 12,
// //   },
// // });

// // export default BannerSlider;

// // components/home/BannerSlider.tsx
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   View,
//   Image,
//   StyleSheet,
//   FlatList,
//   Dimensions,
//   ActivityIndicator,
//   Text,
//   TouchableOpacity,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { RootStackParamList } from '../../navigation/types';
// import { useAppContext } from '../../contexts/AppContext';
// import { margBannerService, MargBanner } from '../../services/api/margBannerService';

// const { width } = Dimensions.get('window');

// type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// export default function BannerSlider() {
//   const navigation = useNavigation<NavigationProp>();
//   const { selectedStore } = useAppContext();
//   const flatListRef = useRef<FlatList>(null);

//   const [banners, setBanners] = useState<MargBanner[]>([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch banners from API
//   useEffect(() => {
//     const loadBanners = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         console.log('\n╔════════════════════════════════════════════════════════════╗');
//         console.log('║  🎬 BANNERSLIDER: Starting to load banners               ║');
//         console.log('╚════════════════════════════════════════════════════════════╝\n');
//         console.log('🏪 Selected Store Info:');
//         console.log('   Store object:', selectedStore);
//         console.log('   Store type:', selectedStore?.type);
//         console.log('   Store name:', selectedStore?.name || 'N/A');

//         // Fetch all banners
//         const allBanners = await margBannerService.getBanners();

//         console.log('\n📦 BANNERSLIDER: Received banners from service');
//         console.log('   Total banners received:', allBanners.length);

//         if (allBanners.length === 0) {
//           console.log('\n⚠️ BANNERSLIDER: No banners received from service');
//           console.log('   🔍 WHY BANNERS NOT DISPLAYED: Service returned 0 banners');
//           console.log('   Check the margBannerService logs above for details');
//           setBanners([]);
//           return;
//         }

//         // Log all received banners
//         console.log('\n📋 BANNERSLIDER: All received banners:');
//         allBanners.forEach((banner, idx) => {
//           console.log(`   Banner ${idx + 1}:`);
//           console.log(`      ID: ${banner.id}`);
//           console.log(`      Store Type: ${banner.storeType}`);
//           console.log(`      Active: ${banner.isActive}`);
//           console.log(`      Image: ${banner.imageUrl?.substring(0, 60)}...`);
//         });

//         // Filter banners based on selected store type
//         console.log('\n🔍 BANNERSLIDER: Filtering banners...');
//         console.log('   Filter criteria:');
//         console.log('      - storeType must match:', selectedStore?.type);
//         console.log('      - isActive must not be false');

//         const filteredBanners = allBanners.filter((banner, index) => {
//           const matchesStoreType = banner.storeType === selectedStore?.type;
//           const isActive = banner.isActive !== false;
//           const passes = matchesStoreType && isActive;

//           console.log(`   Banner ${index + 1} (${banner.id}):`);
//           console.log(`      Store type match: ${matchesStoreType} (banner: ${banner.storeType}, needed: ${selectedStore?.type})`);
//           console.log(`      Is active: ${isActive}`);
//           console.log(`      ➜ ${passes ? '✓ PASSES filter' : '✗ FILTERED OUT'}`);

//           return passes;
//         });

//         console.log('\n📊 BANNERSLIDER: Filter results:');
//         console.log('   Total banners before filter:', allBanners.length);
//         console.log('   Banners after filter:', filteredBanners.length);
//         console.log('   Banners filtered out:', allBanners.length - filteredBanners.length);

//         if (filteredBanners.length === 0) {
//           console.log('\n⚠️ BANNERSLIDER: No banners match the filter criteria!');
//           console.log('   🔍 WHY BANNERS NOT DISPLAYED: All banners filtered out');
//           console.log('   Possible reasons:');
//           console.log('      1. No banners match store type:', selectedStore?.type);
//           console.log('      2. All matching banners have isActive = false');
//           console.log('   Solution:');
//           console.log('      - Check if backend is sending correct storeType values');
//           console.log('      - Verify selectedStore.type matches banner storeType values');
//           console.log('      - Check if isActive field is set correctly');
//         } else {
//           console.log('\n✅ BANNERSLIDER: Banners ready to display:');
//           filteredBanners.forEach((banner, idx) => {
//             console.log(`   ${idx + 1}. ${banner.title || banner.id} (${banner.storeType})`);
//           });
//         }

//         setBanners(filteredBanners);

//         console.log('\n╔════════════════════════════════════════════════════════════╗');
//         console.log('║  ✅ BANNERSLIDER: Load Complete                          ║');
//         console.log('╚════════════════════════════════════════════════════════════╝');
//         console.log(`   ${filteredBanners.length} banner(s) will be displayed\n`);

//       } catch (e: any) {
//         console.log('\n╔════════════════════════════════════════════════════════════╗');
//         console.log('║  ❌ BANNERSLIDER: Error Loading Banners                  ║');
//         console.log('╚════════════════════════════════════════════════════════════╝\n');
//         console.error('❌ BANNERSLIDER: Failed to load banners:', e);
//         console.error('   Error type:', e.name);
//         console.error('   Error message:', e.message);
//         console.error('   Stack:', e.stack);
//         console.error('   🔍 WHY BANNERS NOT DISPLAYED:', e.message);

//         setError(e.message || 'Failed to load banners');
//         setBanners([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     // Only load if we have a selected store
//     if (selectedStore?.type) {
//       console.log('🎬 BANNERSLIDER: Store detected, starting load process...');
//       loadBanners();
//     } else {
//       console.log('⚠️ BANNERSLIDER: No selected store or store type');
//       console.log('   🔍 WHY BANNERS NOT DISPLAYED: selectedStore.type is missing');
//       console.log('   selectedStore:', selectedStore);
//     }
//   }, [selectedStore?.type]);

//   // Auto-scroll banners
//   useEffect(() => {
//     if (banners.length <= 1) return;

//     const timer = setInterval(() => {
//       const nextIndex = currentIndex === banners.length - 1 ? 0 : currentIndex + 1;

//       flatListRef.current?.scrollToIndex({
//         index: nextIndex,
//         animated: true,
//       });
//     }, 3000); // Change banner every 3 seconds

//     return () => clearInterval(timer);
//   }, [currentIndex, banners.length]);

//   // Handle scroll to update current index
//   const handleScroll = (event: any) => {
//     const contentOffsetX = event.nativeEvent.contentOffset.x;
//     const index = Math.round(contentOffsetX / width);
//     setCurrentIndex(index);
//   };

//   // Handle banner press - navigate to detail screen
//   const handleBannerPress = (banner: MargBanner) => {
//     console.log('\n🖼️ BANNERSLIDER: Banner pressed');
//     console.log('   Banner ID:', banner.id);
//     console.log('   Banner title:', banner.title || '(no title)');
//     console.log('   Navigating to BannerDetail screen...');
//     navigation.navigate('BannerDetail', { bannerId: banner.id });
//   };

//   // Render individual banner item
//   const renderBannerItem = ({ item }: { item: MargBanner }) => (
//     <TouchableOpacity
//       style={styles.bannerWrapper}
//       onPress={() => handleBannerPress(item)}
//       activeOpacity={0.9}
//     >
//       <Image
//         source={{ uri: item.imageUrl }}
//         style={styles.bannerImage}
//         resizeMode="cover"
//         onError={(e) => {
//           console.error('\n❌ BANNERSLIDER: Image load error');
//           console.error('   Banner ID:', item.id);
//           console.error('   Image URL:', item.imageUrl);
//           console.error('   Error:', e.nativeEvent.error);
//           console.error('   🔍 WHY BANNER IMAGE NOT SHOWING: Image failed to load');
//           console.error('   Possible reasons:');
//           console.error('      1. Invalid or broken URL');
//           console.error('      2. Network/CORS issue');
//           console.error('      3. Image requires authentication');
//         }}
//         onLoad={() => {
//           console.log('✅ BANNERSLIDER: Image loaded successfully');
//           console.log('   Banner ID:', item.id);
//           console.log('   Image URL:', item.imageUrl?.substring(0, 80));
//         }}
//       />
//       {item.title && (
//         <View style={styles.titleOverlay}>
//           <Text style={styles.titleText} numberOfLines={1}>
//             {item.title}
//           </Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   );

//   // Loading state
//   if (loading) {
//     console.log('🔄 BANNERSLIDER: Rendering loading state...');
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color="#FF6B35" />
//         <Text style={styles.loadingText}>Loading banners...</Text>
//       </View>
//     );
//   }

//   // Error state
//   if (error) {
//     console.log('⚠️ BANNERSLIDER: Rendering error state');
//     console.log('   Error message:', error);
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>⚠️ {error}</Text>
//       </View>
//     );
//   }

//   // No banners state
//   if (banners.length === 0) {
//     console.log('📭 BANNERSLIDER: No banners to display - rendering nothing');
//     console.log('   🔍 Final check: banners array is empty after all processing');
//     return null; // Don't show anything if no banners
//   }

//   // Render banners
//   console.log('🎨 BANNERSLIDER: Rendering', banners.length, 'banner(s)');
//   return (
//     <View style={styles.container}>
//       <FlatList
//         ref={flatListRef}
//         data={banners}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         keyExtractor={(item, index) => `${item.id}-${index}`}
//         renderItem={renderBannerItem}
//         onScroll={handleScroll}
//         scrollEventThrottle={16}
//         onScrollToIndexFailed={(info) => {
//           console.warn('Scroll to index failed:', info);
//           // Try to scroll to a valid index
//           setTimeout(() => {
//             if (info.index < banners.length) {
//               flatListRef.current?.scrollToIndex({
//                 index: info.index,
//                 animated: false,
//               });
//             }
//           }, 100);
//         }}
//       />

//       {/* Pagination dots */}
//       {banners.length > 1 && (
//         <View style={styles.paginationContainer}>
//           {banners.map((_, index) => (
//             <View
//               key={index}
//               style={[
//                 styles.paginationDot,
//                 index === currentIndex && styles.paginationDotActive,
//               ]}
//             />
//           ))}
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     height: 220,
//     marginVertical: 16,
//   },
//   loaderContainer: {
//     height: 220,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginVertical: 16,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 14,
//     color: '#666',
//   },
//   errorContainer: {
//     height: 220,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginVertical: 16,
//     paddingHorizontal: 20,
//   },
//   errorText: {
//     fontSize: 14,
//     color: '#FF6B35',
//     textAlign: 'center',
//   },
//   bannerWrapper: {
//     width: width,
//     paddingHorizontal: 16,
//   },
//   bannerImage: {
//     width: '100%',
//     height: 220,
//     borderRadius: 12,
//     backgroundColor: '#f0f0f0',
//   },
//   titleOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 16,
//     right: 16,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderBottomLeftRadius: 12,
//     borderBottomRightRadius: 12,
//   },
//   titleText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   paginationContainer: {
//     flexDirection: 'row',
//     position: 'absolute',
//     bottom: 10,
//     alignSelf: 'center',
//   },
//   paginationDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: 'rgba(255, 255, 255, 0.5)',
//     marginHorizontal: 4,
//   },
//   paginationDotActive: {
//     backgroundColor: '#fff',
//     width: 20,
//   },
// });

// components/home/BannerSlider.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppContext } from "../../contexts/AppContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  MargBanner,
  margBannerService,
} from "../../services/api/margBannerService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive scaling
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 812) * size;

// Banner dimensions - SMALLER HEIGHT
const BANNER_HEIGHT = verticalScale(140);
const BANNER_HORIZONTAL_PADDING = scale(16);
const BANNER_BORDER_RADIUS = scale(12);

// Fallback banners with proper structure
const fallbackPharmacyBanners: MargBanner[] = [
  {
    id: "fallback-1",
    imageUrl:
      "https://i.ibb.co/DHSpgQXh/file-00000000002471fa9e5bed97c53bd2ce.png",
    title: "Healthcare Essentials",
    description: "Up to 30% off on medicines",
    storeType: "pharma",
    isActive: true,
  },
  {
    id: "fallback-2",
    imageUrl:
      "https://i.ibb.co/0RkqZyJq/file-000000007a9871faa17809e455b6bf0f.png",
    title: "Wellness Products",
    description: "Health supplements & vitamins",
    storeType: "pharma",
    isActive: true,
  },
  {
    id: "fallback-3",
    imageUrl:
      "https://i.ibb.co/20JWjY0k/file-000000000df471fab228d900b1f3c2ae.png",
    title: "Personal Care",
    description: "Premium skincare products",
    storeType: "pharma",
    isActive: true,
  },
  {
    id: "fallback-4",
    imageUrl:
      "https://i.ibb.co/LzyTrVH2/file-000000006b8c71faa38214040f9f9993.png",
    title: "Baby Care",
    description: "Safe products for your baby",
    storeType: "pharma",
    isActive: true,
  },
];

const fallbackGroceryBanners: MargBanner[] = [
  {
    id: "grocery-1",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
    title: "Fresh Groceries",
    description: "Farm fresh vegetables & fruits",
    storeType: "grocery",
    isActive: true,
  },
  {
    id: "grocery-2",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
    title: "Daily Essentials",
    description: "Up to 25% off on daily needs",
    storeType: "grocery",
    isActive: true,
  },
  {
    id: "grocery-3",
    imageUrl:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800",
    title: "Organic Products",
    description: "100% organic & healthy",
    storeType: "grocery",
    isActive: true,
  },
];

// Banner Item Component
const BannerItem = ({ item }: { item: MargBanner }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity style={styles.bannerWrapper} activeOpacity={0.95}>
      <View style={styles.bannerImageContainer}>
        {/* Loading placeholder */}
        {imageLoading && !imageError && (
          <View style={styles.imagePlaceholder}>
            <ActivityIndicator size="small" color="#1E88E5" />
          </View>
        )}

        {/* Error placeholder */}
        {imageError && (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.errorPlaceholderText}>Image not available</Text>
          </View>
        )}

        {/* Actual Image */}
        <Image
          source={{ uri: item.imageUrl }}
          style={[
            styles.bannerImage,
            (imageLoading || imageError) && styles.hiddenImage,
          ]}
          resizeMode="cover"
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
        />

        {/* Gradient Overlay - Optional subtle overlay */}
        <View style={styles.gradientOverlay} />
      </View>
    </TouchableOpacity>
  );
};

// Main Component
export default function BannerSlider() {
  const { theme } = useTheme();
  const { selectedStore } = useAppContext();
  const flatListRef = useRef<FlatList>(null);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);

  const [banners, setBanners] = useState<MargBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Get fallback banners based on store type
  const getFallbackBanners = useCallback(() => {
    if (selectedStore?.type === "grocery") {
      return fallbackGroceryBanners;
    }
    return fallbackPharmacyBanners;
  }, [selectedStore?.type]);

  // Fetch banners from API
  useEffect(() => {
    const loadBanners = async () => {
      try {
        setLoading(true);

        const allBanners = await margBannerService.getBanners();

        if (!allBanners || allBanners.length === 0) {
          setBanners(getFallbackBanners());
          return;
        }

        // Filter banners based on store type and active status
        const filteredBanners = allBanners.filter((banner) => {
          const matchesStoreType = banner.storeType === selectedStore?.type;
          const isActive = banner.isActive !== false;
          return matchesStoreType && isActive;
        });

        if (filteredBanners.length === 0) {
          setBanners(getFallbackBanners());
        } else {
          setBanners(filteredBanners);
        }
      } catch (e: any) {
        console.log("Banner fetch error:", e.message);
        setBanners(getFallbackBanners());
      } finally {
        setLoading(false);
      }
    };

    if (selectedStore?.type) {
      loadBanners();
    } else {
      setBanners(fallbackPharmacyBanners);
      setLoading(false);
    }
  }, [selectedStore?.type, getFallbackBanners]);

  useEffect(() => {
    if (banners.length <= 1) return;

    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }

    autoScrollTimer.current = setInterval(() => {
      // Always work with a safe, in-range index
      setCurrentIndex((prevIndex) => {
        if (banners.length <= 1) {
          return 0;
        }

        const safePrevIndex = Math.min(prevIndex, banners.length - 1);
        const nextIndex =
          safePrevIndex === banners.length - 1 ? 0 : safePrevIndex + 1;

        if (flatListRef.current) {
          try {
            flatListRef.current.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          } catch {
            // Ignore rare race-condition errors; onScrollToIndexFailed will also handle
          }
        }

        return nextIndex;
      });
    }, 4000);

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [banners.length]);

  // Keep currentIndex in range when banner list size changes
  useEffect(() => {
    if (banners.length === 0 && currentIndex !== 0) {
      setCurrentIndex(0);
    } else if (banners.length > 0 && currentIndex > banners.length - 1) {
      setCurrentIndex(banners.length - 1);
    }
  }, [banners.length, currentIndex]);

  // Handle scroll event
  const handleScroll = useCallback(
    (event: any) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / SCREEN_WIDTH);
      if (index !== currentIndex && index >= 0 && index < banners.length) {
        setCurrentIndex(index);
      }
    },
    [currentIndex, banners.length],
  );

  // Render banner item
  const renderBannerItem = ({ item }: { item: MargBanner }) => (
    <BannerItem item={item} />
  );

  // Handle scroll to index failure
  const handleScrollToIndexFailed = useCallback(
    (info: any) => {
      setTimeout(() => {
        if (flatListRef.current && info.index < banners.length) {
          flatListRef.current.scrollToIndex({
            index: Math.min(info.index, banners.length - 1),
            animated: false,
          });
        }
      }, 100);
    },
    [banners.length],
  );

  // Key extractor
  const keyExtractor = (item: MargBanner, index: number) =>
    `banner-${item.id}-${index}`;

  // Loading state - Skeleton loader
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonContainer}>
          <View
            style={[styles.skeleton, { backgroundColor: theme.colors.border }]}
          >
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        </View>
      </View>
    );
  }

  // No banners available
  if (banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderBannerItem}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        initialNumToRender={2}
        maxToRenderPerBatch={4}
        windowSize={4}
        removeClippedSubviews={Platform.OS === "android"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    marginVertical: verticalScale(8),
  },
  skeletonContainer: {
    paddingHorizontal: BANNER_HORIZONTAL_PADDING,
  },
  skeleton: {
    width: SCREEN_WIDTH - BANNER_HORIZONTAL_PADDING * 2,
    height: BANNER_HEIGHT,
    borderRadius: BANNER_BORDER_RADIUS,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerWrapper: {
    width: SCREEN_WIDTH,
    paddingHorizontal: BANNER_HORIZONTAL_PADDING,
  },
  bannerImageContainer: {
    width: "100%",
    height: BANNER_HEIGHT,
    borderRadius: BANNER_BORDER_RADIUS,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  hiddenImage: {
    opacity: 0,
    position: "absolute",
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  errorPlaceholderText: {
    fontSize: scale(12),
    color: "#999",
    textAlign: "center",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
});
