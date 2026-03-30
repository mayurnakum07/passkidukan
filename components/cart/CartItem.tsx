// components/CartItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CartItem = ({ item, onRemove }: { item: any, onRemove: () => void }) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.dark ? '#4B3F1D' : '#FFF9E5',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: theme.dark ? '#000' : '#FFD700',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    details: {
      flexDirection: 'row',
    },
    price: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    quantity: {
      color: theme.colors.secondary,
      marginHorizontal: theme.spacing.sm,
    },
    removeButton: {
      padding: theme.spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.name}>
  {item.name.length > 20 ? `${item.name.slice(0, 10)}...` : item.name}
</Text>

        <View style={styles.details}>
          <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
          {item.originalPrice && item.originalPrice > item.price && (
            <Text style={[styles.price, { textDecorationLine: 'line-through', color: theme.colors.secondary, marginLeft: 6 }]}>₹{item.originalPrice.toFixed(2)}</Text>
          )}
          {item.originalPrice && item.originalPrice > item.price && (
            <Text style={[styles.price, { color: '#FF9800', marginLeft: 6 }]}>{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% off</Text>
          )}
          <Text style={styles.quantity}>x {item.quantity}</Text>
          <Text style={styles.price}>
            ₹{(item.price * item.quantity).toFixed(2)}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.removeButton} 
        onPress={onRemove}
      >
        <MaterialCommunityIcons 
          name="trash-can-outline" 
          size={20} 
          color={theme.colors.error} 
        />
      </TouchableOpacity>
    </View>
  );
};

export default CartItem;