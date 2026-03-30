import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  expanded?: boolean;
}

const ThemeToggle = ({ expanded = false }: ThemeToggleProps) => {
  const { toggleTheme, theme } = useTheme();

  if (expanded) {
    return (
      <TouchableOpacity 
        onPress={toggleTheme}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={theme.dark ? 'sunny' : 'moon'}
          size={24}
          color={theme.colors.text}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={toggleTheme} activeOpacity={0.7}>
      <Ionicons
        name={theme.dark ? 'sunny' : 'moon'}
        size={24}
        color={theme.colors.text}
      />
    </TouchableOpacity>
  );
};

export default ThemeToggle;