// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import * as Location from 'expo-location';
// import { useTheme } from '../contexts/ThemeContext';
// import { ThemedButton } from '../../components';

// const LocationPermissionScreen: React.FC = () => {
//   const { theme } = useTheme();

//   const requestLocationPermission = async () => {
//     const { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== 'granted') {
//       alert('Permission to access location was denied');
//     }
//   };

//   const styles = StyleSheet.create({
//     container: {
//       flex: 1,
//       justifyContent: 'center',
//       alignItems: 'center',
//       backgroundColor: theme.colors.background,
//       padding: theme.spacing.md,
//     },
//     text: {
//       fontSize: 20,
//       fontWeight: 'bold',
//       color: theme.colors.text,
//       textAlign: 'center',
//       marginBottom: theme.spacing.lg,
//     },
//   });

//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.text}>We need your location to show you nearby stores.</Text>
//       <ThemedButton title="Allow Location Access" onPress={requestLocationPermission} />
//     </SafeAreaView>
//   );
// };

// export default LocationPermissionScreen; 

// LocationPermissionScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTheme } from '../../contexts/ThemeContext';
import ThemedButton from '../../components/ui/ThemedButton';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LocationPermissionScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

const LocationPermissionScreen: React.FC<LocationPermissionScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      navigation.navigate('Pincode');
    } else {
      alert('Permission to access location was denied');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    gradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    content: {
      alignItems: 'center',
      width: '100%',
    },
    icon: {
      marginBottom: spacing.xl,
    },
    text: {
      ...typography.h2,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: typography.h2.fontSize * 1.3,
    },
    description: {
      ...typography.body1,
      color: colors.text,
      opacity: 0.8,
      textAlign: 'center',
      marginBottom: spacing.xl,
      lineHeight: typography.body1.fontSize * 1.5,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.background]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <Animated.View style={[styles.content, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}>
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={72}
            color={colors.primary}
            style={styles.icon}
          />
          <Text style={styles.text}>Discover Stores Near You</Text>
          <Text style={styles.description}>
            We need your location to show you nearby stores and personalize your experience.
            Your data is always secure and private.
          </Text>
          <ThemedButton
            title="Allow Location Access"
            onPress={requestLocationPermission}
            icon="map-marker-check" // Now using the correct prop name
          />
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default LocationPermissionScreen;