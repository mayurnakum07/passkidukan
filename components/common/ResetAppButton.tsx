// components/common/ResetAppButton.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';

interface ResetAppButtonProps {
  title?: string;
  resetAll?: boolean;
  showConfirmation?: boolean;
}

export const ResetAppButton: React.FC<ResetAppButtonProps> = ({ 
  title = "Reset App", 
  resetAll = false,
  showConfirmation = true 
}) => {
  const { theme } = useTheme();
  const { clearCart, resetAllContexts } = useCart();

  const handleReset = async () => {
    if (showConfirmation) {
      Alert.alert(
        resetAll ? "Reset All Data" : "Clear Cart",
        resetAll 
          ? "This will clear ALL app data including cart, user data, preferences, and settings. Are you sure?"
          : "This will clear your cart. Are you sure?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: resetAll ? "Reset All" : "Clear Cart",
            style: "destructive",
            onPress: executeReset
          }
        ]
      );
    } else {
      executeReset();
    }
  };

  const executeReset = async () => {
    try {
      if (resetAll) {
        console.log('🔄 Resetting all app contexts...');
        await resetAllContexts();
        Alert.alert("Success", "All app data has been reset!");
      } else {
        console.log('🧹 Clearing cart...');
        await clearCart();
        Alert.alert("Success", "Cart has been cleared!");
      }
    } catch (error) {
      console.error('  Error during reset:', error);
      Alert.alert("Error", "Failed to reset. Please try again.");
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: resetAll ? '#FF4444' : theme.colors.primary,
          borderColor: resetAll ? '#FF4444' : theme.colors.primary
        }
      ]}
      onPress={handleReset}
    >
      <Text style={styles.buttonText}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
