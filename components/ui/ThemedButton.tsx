import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Easing, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ViewStyle } from 'react-native';

// Define valid icon names based on MaterialCommunityIcons
type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  icon?: MaterialIconName;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const ThemedButton: React.FC<ThemedButtonProps> = ({ 
  title, 
  onPress, 
  color, 
  icon, 
  disabled = false,
  fullWidth = false,
  style
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing, borderRadius } = theme;
  const scaleValue = new Animated.Value(1);
  const opacityValue = new Animated.Value(1);

  // Use theme color if no specific color provided
  const buttonColor = color || colors.primary;
  // Fallback colors
  const textColor = disabled ? '#999' : '#fff'; // Default text colors
  const disabledColor = '#ccc'; // Default disabled color

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    Animated.timing(opacityValue, {
      toValue: disabled ? 0.6 : 1,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [disabled]);

  // Define button text styles separately to avoid TypeScript issues
  const buttonTextStyles = {
    fontSize: 16,
    fontWeight: '600' as const, // Explicitly type as const to satisfy TypeScript
    color: textColor,
    marginLeft: icon ? spacing.sm : 0,
    textTransform: 'uppercase' as const,
  };

  const styles = StyleSheet.create({
    button: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      alignSelf: fullWidth ? undefined : 'center',
      width: fullWidth ? '100%' : undefined,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    iconContainer: {
      marginRight: spacing.xs,
    },
  });

  return (
    <Animated.View style={[{ opacity: opacityValue }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.button, 
          { 
            backgroundColor: disabled ? disabledColor : buttonColor,
            transform: [{ scale: scaleValue }]
          }
        ]}
      >
        {icon && (
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={icon} 
              size={16} 
              color={textColor} 
            />
          </View>
        )}
        <Text style={buttonTextStyles}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ThemedButton;