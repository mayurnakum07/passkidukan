// components/modals/SortModal.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define the allowed sort option keys
export type SortOptionKey =
  | 'relevance'
  | 'price_low_high'
  | 'price_high_low'
  | 'a_z'
  | 'z_a'
  | ''

interface SortOption {
  key: SortOptionKey;
  label: string;
}

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  sortBy: SortOptionKey;
  setSortBy: (sortBy: SortOptionKey) => void;
  sortOptions: SortOption[];
}

const SortModal: React.FC<SortModalProps> = ({
  visible,
  onClose,
  sortBy,
  setSortBy,
  sortOptions,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets(); // ✅ correct place

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: theme.colors.text + '55' }}
        onPress={onClose}
      />

      {/* Bottom Sheet */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          padding: 24,
          paddingBottom: 24 + insets.bottom, // 🔥 KEY FIX
          minHeight: 220,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: theme.colors.text,
            }}
          >
            Sort By
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons
              name="close"
              size={26}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Options */}
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
            onPress={() => {
              setSortBy(option.key);
              onClose();
            }}
          >
            <MaterialCommunityIcons
              name={
                sortBy === option.key
                  ? 'check-circle'
                  : 'circle-outline'
              }
              size={22}
              color={
                sortBy === option.key
                  ? theme.colors.primary
                  : theme.colors.text
              }
              style={{ marginRight: 12 }}
            />
            <Text
              style={{
                color: theme.colors.text,
                fontWeight:
                  sortBy === option.key ? 'bold' : 'normal',
                fontSize: 16,
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
};

export default SortModal;