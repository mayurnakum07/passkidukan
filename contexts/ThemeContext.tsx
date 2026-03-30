import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { lightTheme, darkTheme, Theme } from '../theme/theme';
import { useStorage } from './StorageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';
type AppSection = 'grocery' | 'pharma';

interface ThemeContextProps {
  theme: Theme;
  themeMode: ThemeMode;
  section: AppSection;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setSection: (section: AppSection) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { appSection, setAppSection } = useStorage();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  // Load theme mode from local storage
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('themeMode');
        if (savedThemeMode && (savedThemeMode === 'light' || savedThemeMode === 'dark')) {
          setThemeMode(savedThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      }
    };
    loadThemeMode();
  }, []);

  // Save theme mode to local storage
  const saveThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    saveThemeMode(newMode);
  };

  const theme = useMemo(() => {
    const baseTheme = themeMode === 'light' ? lightTheme : darkTheme;
    const section: AppSection = appSection === 'pharma' ? 'pharma' : 'grocery';
    const sectionColors = baseTheme.colors[section];

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: sectionColors.primary,
        secondary: sectionColors.secondary,
        tertiary: sectionColors.tertiary,
      },
    };
  }, [themeMode, appSection]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      themeMode,
      section: (appSection || 'pharma') as AppSection,
      setThemeMode,
      toggleTheme, 
      setSection: setAppSection 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};