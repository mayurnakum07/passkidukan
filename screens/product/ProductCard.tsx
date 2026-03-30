import React from 'react';
import { TouchableOpacity, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

const styles = StyleSheet.create({
  card: {
    // You can add default card styles here if needed, or leave it empty if all styles are inline
  },
});

const ProductCard = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        style,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          margin: 8,
          padding: 10,
          borderRadius: 12,
          shadowColor: theme.colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        },
      ]}
    >
      {/* Rest of the component content */}
    </TouchableOpacity>
  );
};

export default ProductCard; 