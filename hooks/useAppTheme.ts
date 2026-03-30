import { useTheme } from '../contexts/ThemeContext';
import { StyleSheet } from 'react-native';
import { Theme } from '../theme/theme';  // Adjust path as needed

export const useAppTheme = () => {
  const { theme, themeMode, setThemeMode } = useTheme();

  const createStyles = (styleCallback: (theme: Theme) => any) => {
    return StyleSheet.create(styleCallback(theme));
  };

  return {
    theme,
    themeMode,
    setThemeMode,
    createStyles,
    colors: theme.colors, // Directly access colors
    typography: theme.typography,
    spacing: theme.spacing,
    borderRadius: theme.borderRadius,
    shadows: theme.shadows,
    isDark: themeMode === 'dark',
  };
}; 