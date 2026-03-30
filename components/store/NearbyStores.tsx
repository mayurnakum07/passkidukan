// // components/NearbyStores.tsx
// import React from 'react';
// import { View, Text, FlatList, StyleSheet } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import StoreCard from './StoreCard';
// import { RootStackParamList } from '../navigation/types';
// import { useTheme } from '../contexts/ThemeContext';

// type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'StoreSelection'>;

// const nearbyStores = [
//   { 
//     id: '1', 
//     name: 'Fresh Grocery Mart', 
//     type: 'grocery',
//     distance: '0.5 km',
//     rating: 4.5,
//     image: require('../assets/grocery-store.jpg')
//   },
//   { 
//     id: '2', 
//     name: 'Quick Pharmacy', 
//     type: 'pharmacy',
//     distance: '1.2 km',
//     rating: 4.2,
//     image: require('../assets/pharmacy-store.jpg')
//   },
// ];

// const NearbyStores = () => {
//   const navigation = useNavigation<NavigationProp>();
//   const { theme } = useTheme();

//   const handleStorePress = (store: any) => {
//     if (store.type === 'grocery') {
//       navigation.navigate('GroceryHome', { storeId: store.id });
//     } else {
//       navigation.navigate('PharmacyHome', { storeId: store.id });
//     }
//   };

//   const styles = StyleSheet.create({
//     container: {
//       padding: theme.spacing.md,
//     },
//     title: {
//       fontSize: 20,
//       fontWeight: 'bold',
//       color: theme.colors.text,
//       marginBottom: theme.spacing.md,
//     },
//   });

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Nearby Stores</Text>
//       <FlatList
//         data={nearbyStores}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <StoreCard 
//             store={item} 
//             onPress={() => handleStorePress(item)}
//             style={{ width: 250, marginRight: theme.spacing.md }}
//           />
//         )}
//       />
//     </View>
//   );
// };

// export default NearbyStores;

import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StoreCard from './StoreCard';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'StoreSelection'>;

interface NearbyStore {
  id: string;
  name: string;
  type: 'grocery' | 'pharma';
  distance: string;
  rating: number;
  image: any; // or use a more specific type for images
}

const nearbyStores: NearbyStore[] = [
  { 
    id: '1', 
    name: 'Fresh Grocery Mart', 
    type: 'grocery',
    distance: '0.5 km',
    rating: 4.5,
    image: require('../../assets/grocery-store.jpg')
  },
  { 
    id: '2', 
    name: 'Quick Pharmacy', 
    type: 'pharma',
    distance: '1.2 km',
    rating: 4.2,
    image: require('../../assets/pharmacy-store.jpg')
  },
];

const NearbyStores = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const handleStorePress = (store: NearbyStore) => {
    if (store.type === 'grocery') {
      navigation.navigate('GroceryHome', { storeId: store.id });
    } else {
      navigation.navigate('PharmacyHome', { storeId: store.id });
    }
  };

  const styles = StyleSheet.create({
    container: {
      padding: theme.spacing.md,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    listContainer: {
      height: 180, // Add fixed height for horizontal list
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Stores</Text>
      <FlatList
        data={nearbyStores}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StoreCard 
            store={item} 
            onPress={() => handleStorePress(item)}
            style={{ width: 250, marginRight: theme.spacing.md }}
          />
        )}
      />
    </View>
  );
};

export default NearbyStores;