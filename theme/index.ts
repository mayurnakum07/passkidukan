// NativeBase theme configuration
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

// Custom colors
const colors = {
  // Initial app colors (red gradient)
  primary: {
    light: '#FF4500',
    dark: '#FF6347',
  },
  secondary: {
    light: '#FF8C00',
    dark: '#FFA500',
  },
  // Grocery section colors
  grocery: {
    primary: '#4CAF50',
    secondary: '#81C784',
  },
  // Pharmacy section colors
  pharmacy: {
    primary: '#2196F3',
    secondary: '#64B5F6',
  },
  // Common colors
  background: {
    light: '#FFFFFF',
    dark: '#121212',
  },
  surface: {
    light: '#F5F5F5',
    dark: '#1E1E1E',
  },
  text: {
    light: '#000000',
    dark: '#FFFFFF',
  },
  error: {
    light: '#B00020',
    dark: '#CF6679',
  },
};

// Typography
const typography = {
  fontFamily: 'Roboto',
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
};

// Spacing
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

// Shadows
const shadows = {
  light: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  dark: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// Light theme
export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary.light,
    secondary: colors.secondary.light,
    background: colors.background.light,
    surface: colors.surface.light,
    text: colors.text.light,
    error: colors.error.light,
  },
  typography,
  spacing,
  borderRadius,
  shadows: shadows.light,
  grocery: colors.grocery,
  pharmacy: colors.pharmacy,
};

// Dark theme
export const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary.dark,
    secondary: colors.secondary.dark,
    background: colors.background.dark,
    surface: colors.surface.dark,
    text: colors.text.dark,
    error: colors.error.dark,
  },
  typography,
  spacing,
  borderRadius,
  shadows: shadows.dark,
  grocery: colors.grocery,
  pharmacy: colors.pharmacy,
};

export type AppTheme = typeof lightTheme;