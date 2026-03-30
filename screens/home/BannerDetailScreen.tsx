// // import React from 'react';
// // import { View, Text, StyleSheet } from 'react-native';
// // import { SafeAreaView } from 'react-native-safe-area-context';
// // import { useTheme } from '../../contexts/ThemeContext';
// // import { RouteProp } from '@react-navigation/native';
// // import { RootStackParamList } from '../../navigation/types';

// // type BannerDetailScreenRouteProp = RouteProp<RootStackParamList, 'BannerDetail'>;

// // interface Props {
// //   route: BannerDetailScreenRouteProp;
// // }

// // const BannerDetailScreen: React.FC<Props> = ({ route }) => {
// //   const { theme } = useTheme();
// //   const { bannerId } = route.params;

// //   return (
// //     <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
// //       <Text style={[styles.text, { color: theme.colors.text }]}>
// //         Banner Detail Screen
// //       </Text>
// //       <Text style={[styles.subText, { color: theme.colors.secondary }]}>
// //         Banner ID: {bannerId}
// //       </Text>
// //     </SafeAreaView>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     padding: 20,
// //   },
// //   text: {
// //     fontSize: 24,
// //     fontWeight: 'bold',
// //     marginBottom: 10,
// //   },
// //   subText: {
// //     fontSize: 16,
// //   },
// // });

// // export default BannerDetailScreen; 




// // screens/BannerDetailScreen.tsx
// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   ScrollView,
//   ActivityIndicator,
//   TouchableOpacity,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useTheme } from '../../contexts/ThemeContext';
// import { RouteProp, useNavigation } from '@react-navigation/native';
// import { RootStackParamList } from '../../navigation/types';
// import { margBannerService, MargBanner } from '../../services/api/margBannerService';

// type BannerDetailScreenRouteProp = RouteProp<RootStackParamList, 'BannerDetail'>;

// interface Props {
//   route: BannerDetailScreenRouteProp;
// }

// const BannerDetailScreen: React.FC<Props> = ({ route }) => {
//   const { theme } = useTheme();
//   const navigation = useNavigation();
//   const { bannerId } = route.params;

//   const [banner, setBanner] = useState<MargBanner | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const loadBannerDetails = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         console.log('\n╔════════════════════════════════════════════════════════════╗');
//         console.log('║  📖 BANNER DETAIL: Loading banner details               ║');
//         console.log('╚════════════════════════════════════════════════════════════╝\n');
//         console.log('🔍 Requested Banner ID:', bannerId);
        
//         const bannerData = await margBannerService.getBannerById(bannerId);
        
//         if (bannerData) {
//           console.log('✅ BANNER DETAIL: Banner found');
//           console.log('   ID:', bannerData.id);
//           console.log('   Title:', bannerData.title || '(no title)');
//           console.log('   Store Type:', bannerData.storeType);
//           console.log('   Image URL:', bannerData.imageUrl?.substring(0, 80));
//           setBanner(bannerData);
//         } else {
//           console.log('❌ BANNER DETAIL: Banner not found');
//           console.log('   Searched for ID:', bannerId);
//           console.log('   🔍 WHY BANNER NOT SHOWING: No banner with this ID exists');
//           setError('Banner not found');
//         }
//       } catch (e: any) {
//         console.error('\n❌ BANNER DETAIL: Error loading banner');
//         console.error('   Error:', e.message);
//         console.error('   Stack:', e.stack);
//         console.error('   🔍 WHY BANNER NOT SHOWING:', e.message);
//         setError(e.message || 'Failed to load banner details');
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadBannerDetails();
//   }, [bannerId]);

//   if (loading) {
//     return (
//       <SafeAreaView
//         style={[styles.container, { backgroundColor: theme.colors.background }]}
//         edges={['top']}
//       >
//         <View style={styles.centerContent}>
//           <ActivityIndicator size="large" color="#FF6B35" />
//           <Text style={[styles.loadingText, { color: theme.colors.text }]}>
//             Loading banner details...
//           </Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (error || !banner) {
//     return (
//       <SafeAreaView
//         style={[styles.container, { backgroundColor: theme.colors.background }]}
//         edges={['top']}
//       >
//         <View style={styles.centerContent}>
//           <Text style={[styles.errorText, { color: '#FF6B35' }]}>
//             {error || 'Banner not found'}
//           </Text>
//           <TouchableOpacity
//             style={styles.backButton}
//             onPress={() => navigation.goBack()}
//           >
//             <Text style={styles.backButtonText}>Go Back</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView
//       style={[styles.container, { backgroundColor: theme.colors.background }]}
//       edges={['top']}
//     >
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         {/* Banner Image */}
//         <Image
//           source={{ uri: banner.imageUrl }}
//           style={styles.bannerImage}
//           resizeMode="cover"
//         />

//         {/* Banner Details */}
//         <View style={styles.detailsContainer}>
//           {banner.title && (
//             <>
//               <Text style={[styles.titleLabel, { color: theme.colors.secondary }]}>
//                 Title
//               </Text>
//               <Text style={[styles.title, { color: theme.colors.text }]}>
//                 {banner.title}
//               </Text>
//             </>
//           )}

//           {banner.description && (
//             <>
//               <Text style={[styles.descriptionLabel, { color: theme.colors.secondary }]}>
//                 Description
//               </Text>
//               <Text style={[styles.description, { color: theme.colors.text }]}>
//                 {banner.description}
//               </Text>
//             </>
//           )}

//           {/* Store Type Badge */}
//           <View style={styles.badgeContainer}>
//             <View
//               style={[
//                 styles.badge,
//                 { backgroundColor: banner.storeType === 'pharma' ? '#4CAF50' : '#FF6B35' },
//               ]}
//             >
//               <Text style={styles.badgeText}>
//                 {banner.storeType === 'pharma' ? '💊 Pharmacy' : '🛒 Grocery'}
//               </Text>
//             </View>
//           </View>

//           {/* Banner ID (for debugging) */}
//           <Text style={[styles.metaText, { color: theme.colors.secondary }]}>
//             Banner ID: {banner.id}
//           </Text>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   centerContent: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//   },
//   errorText: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   backButton: {
//     backgroundColor: '#FF6B35',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   backButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   scrollContent: {
//     paddingBottom: 20,
//   },
//   bannerImage: {
//     width: '100%',
//     height: 300,
//     backgroundColor: '#f0f0f0',
//   },
//   detailsContainer: {
//     padding: 20,
//   },
//   titleLabel: {
//     fontSize: 12,
//     fontWeight: '600',
//     textTransform: 'uppercase',
//     marginBottom: 8,
//     marginTop: 20,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 16,
//   },
//   descriptionLabel: {
//     fontSize: 12,
//     fontWeight: '600',
//     textTransform: 'uppercase',
//     marginBottom: 8,
//     marginTop: 20,
//   },
//   description: {
//     fontSize: 16,
//     lineHeight: 24,
//     marginBottom: 16,
//   },
//   badgeContainer: {
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   badge: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//   },
//   badgeText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   metaText: {
//     fontSize: 12,
//     marginTop: 20,
//   },
// });

// export default BannerDetailScreen;


// screens/BannerDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { margBannerService, MargBanner } from '../../services/api/margBannerService';

type BannerDetailScreenRouteProp = RouteProp<RootStackParamList, 'BannerDetail'>;

interface Props {
  route: BannerDetailScreenRouteProp;
}

const BannerDetailScreen: React.FC<Props> = ({ route }) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { bannerId } = route.params;

  const [banner, setBanner] = useState<MargBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBannerDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║  📖 BANNER DETAIL: Loading banner details               ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        console.log('🔍 Requested Banner ID:', bannerId);
        
        const bannerData = await margBannerService.getBannerById(bannerId);
        
        if (bannerData) {
          console.log('✅ BANNER DETAIL: Banner found');
          console.log('   ID:', bannerData.id);
          console.log('   Title:', bannerData.title || '(no title)');
          console.log('   Store Type:', bannerData.storeType);
          console.log('   Image URL:', bannerData.imageUrl?.substring(0, 80));
          setBanner(bannerData);
        } else {
          console.log('❌ BANNER DETAIL: Banner not found');
          console.log('   Searched for ID:', bannerId);
          console.log('   🔍 WHY BANNER NOT SHOWING: No banner with this ID exists');
          setError('Banner not found');
        }
      } catch (e: any) {
        console.error('\n❌ BANNER DETAIL: Error loading banner');
        console.error('   Error:', e.message);
        console.error('   Stack:', e.stack);
        console.error('   🔍 WHY BANNER NOT SHOWING:', e.message);
        setError(e.message || 'Failed to load banner details');
      } finally {
        setLoading(false);
      }
    };

    loadBannerDetails();
  }, [bannerId]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading banner details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !banner) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: '#FF6B35' }]}>
            {error || 'Banner not found'}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Image */}
        <Image
          source={{ uri: banner.imageUrl }}
          style={styles.bannerImage}
          resizeMode="cover"
        />

        {/* Banner Details */}
        <View style={styles.detailsContainer}>
          {banner.title && (
            <>
              <Text style={[styles.titleLabel, { color: theme.colors.secondary }]}>
                Title
              </Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {banner.title}
              </Text>
            </>
          )}

          {banner.description && (
            <>
              <Text style={[styles.descriptionLabel, { color: theme.colors.secondary }]}>
                Description
              </Text>
              <Text style={[styles.description, { color: theme.colors.text }]}>
                {banner.description}
              </Text>
            </>
          )}

          {/* Store Type Badge */}
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.badge,
                { backgroundColor: banner.storeType === 'pharma' ? '#4CAF50' : '#FF6B35' },
              ]}
            >
              <Text style={styles.badgeText}>
                {banner.storeType === 'pharma' ? '💊 Pharmacy' : '🛒 Grocery'}
              </Text>
            </View>
          </View>

          {/* Banner ID (for debugging) */}
          <Text style={[styles.metaText, { color: theme.colors.secondary }]}>
            Banner ID: {banner.id}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  bannerImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  detailsContainer: {
    padding: 20,
  },
  titleLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  badgeContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 12,
    marginTop: 20,
  },
});

export default BannerDetailScreen;