import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import ThemedButton from '../../components/ui/ThemedButton';
import { PharmacyStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';

type MedicineDetailRouteProp = RouteProp<PharmacyStackParamList, 'MedicineDetail'>;

const MedicineDetailScreen = () => {
  const route = useRoute<MedicineDetailRouteProp>();
  const { medicine } = route.params;
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    price: {
      fontSize: 18,
      color: theme.colors.primary,
      marginBottom: theme.spacing.lg,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>{medicine.name}</Text>
      <Text style={styles.price}>${medicine.price}</Text>
      <ThemedButton title="Add to Cart" onPress={() => {}} />
    </SafeAreaView>
  );
};

export default MedicineDetailScreen; 