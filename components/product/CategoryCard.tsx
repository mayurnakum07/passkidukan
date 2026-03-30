import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Category {
  id: string;
  name: string;
}

interface CategoryCardProps {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, isSelected, onPress }) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      padding: theme.spacing.md,
      margin: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
    },
    text: {
      color: isSelected ? theme.colors.surface : theme.colors.text,
      fontWeight: 'bold',
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.text}>{category.name}</Text>
    </TouchableOpacity>
  );
};

export default CategoryCard;