import { DefaultTheme, DarkTheme } from '@react-navigation/native';

export const palette = {
  // Primary yellow and white for new look
  primary_yellow: '#FBBC05', // Google yellow
  primary_white: '#FFFFFF',
  // Primary green shades for grocery
  primary_green: '#34A853',
  secondary_green: '#81C784',
  tertiary_green: '#A5D6A7',

  // Primary blue shades for pharmacy
  primary_blue: '#4285F4',
  secondary_blue: '#90CAF9',
  tertiary_blue: '#B3E5FC',

  // Neutral shades
  neutral_white: '#FFFFFF',
  neutral_black: '#000000',
  neutral_grey_light: '#F5F5F5',
  neutral_grey_dark: '#1E1E1E',

  // Accent colors
  accent_yellow: '#FBBC05',
  accent_red: '#EA4335',
};

const typography = {
  fontFamily: 'Roboto',
  h1: {
    fontSize: 32,
    fontWeight: '700' as '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as '700',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as '700',
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

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

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

export const lightTheme = {
  ...DefaultTheme,
  gradient: ['#5B7CFA', '#8FA2FF'],
  gradientStart: '#5B7CFA',
  gradientEnd: '#8FA2FF',
  gredientSecondary: ['#A6B9FF', '#DEE5FF'],
  gredientProduct: ['#DEE5FF', '#fff'],
  colors: {
    ...DefaultTheme.colors,
    primary: palette.primary_yellow,
    secondary: palette.primary_green,
    tertiary: palette.primary_blue,
    background: palette.primary_white,
    surface: palette.neutral_grey_light,
    text: palette.neutral_black,
    accent: palette.accent_yellow,
    highlight: palette.primary_yellow,
    error: palette.accent_red,
    // Grocery-specific colors
    grocery: {
      primary: palette.primary_green,
      secondary: palette.secondary_green,
      tertiary: palette.tertiary_green,
    },
    // Pharmacy-specific colors
    pharma: {
      primary: palette.primary_blue,
      secondary: palette.secondary_blue,
      tertiary: palette.tertiary_blue,
    },
    yellow: palette.primary_yellow,
    white: palette.primary_white,
  },
  typography,
  spacing,
  borderRadius,
  shadows: shadows.light,
};

export const darkTheme = {
  ...DarkTheme,
  gradient: ['#6A82FB', '#8998FF'],
  colors: {
    ...DarkTheme.colors,
    primary: palette.primary_yellow,
    secondary: palette.primary_green,
    tertiary: palette.primary_blue,
    background: palette.neutral_black,
    surface: palette.neutral_grey_dark,
    text: palette.neutral_white,
    accent: palette.accent_yellow,
    highlight: palette.primary_yellow,
    error: palette.accent_red,
    grocery: {
      primary: palette.primary_green,
      secondary: palette.secondary_green,
      tertiary: palette.tertiary_green,
    },
    pharma: {
      primary: palette.primary_blue,
      secondary: palette.secondary_blue,
      tertiary: palette.tertiary_blue,
    },
    yellow: palette.primary_yellow,
    white: palette.primary_white,
  },
  typography,
  spacing,
  borderRadius,
  shadows: shadows.dark,
};

export type Theme = typeof lightTheme;