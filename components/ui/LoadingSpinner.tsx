// components/LoadingSpinner.tsx
import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

interface Props {
  size?: 'small' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<Props> = ({ size = 'large', color = '#000' }) => {
  return (
    <View style={styles.spinner}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  spinner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinner;
