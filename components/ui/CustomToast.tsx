import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';

const { width } = Dimensions.get('window');

const CustomToast: React.FC = () => {
  const { theme } = useTheme();
  const { isVisible, toastMessage, hideToast } = useToast();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Slide in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 2 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideToast();
    });
  };

  if (!isVisible) return null;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 100,
      left: 16,
      right: 16,
      zIndex: 9999,
    },
    toast: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      minHeight: 50,
    },
    messageContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
    },
    icon: {
      marginRight: 8,
    },
    message: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
      flex: 1,
    },
    closeButton: {
      padding: 4,
      marginLeft: 8,
      minWidth: 24,
      alignItems: 'center',
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.toast}>
        <View style={styles.messageContainer}>
          <MaterialIcons
            name="check-circle"
            size={20}
            color={theme.colors.primary}
            style={styles.icon}
          />
          <Text style={styles.message}>{toastMessage}</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <MaterialIcons
            name="close"
            size={20}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default CustomToast; 