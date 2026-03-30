// components/StoreSection.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const StoreSection = ({ store }: { store: any }) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      ...theme.shadows.small,
    },
    name: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    details: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    detailText: {
      color: theme.colors.secondary,
      fontSize: 14,
    },
    changeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    changeText: {
      color: theme.colors.primary,
      marginLeft: theme.spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{store.name}</Text>
      <View style={styles.details}>
        <Text style={styles.detailText}>{store.distance}</Text>
        <Text style={styles.detailText}>Rating: {store.rating}</Text>
      </View>
      <TouchableOpacity style={styles.changeButton}>
        <MaterialCommunityIcons 
          name="store-edit-outline" 
          size={18} 
          color={theme.colors.primary} 
        />
        <Text style={styles.changeText}>Change Store</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StoreSection;