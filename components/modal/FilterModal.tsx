// components/modals/FilterModal.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  allBrands: string[];
  selectedBrands: string[];
  setSelectedBrands: (brands: string[]) => void;
  // clearAllFilters: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  allBrands,
  selectedBrands,
  setSelectedBrands,
  // clearAllFilters,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedFilterTab, setSelectedFilterTab] = useState('Brand');
  const [brandSearch, setBrandSearch] = useState('');
  
  const filterTabs = [
    { key: 'Brand', label: 'Brand' },
    { key: 'Type', label: 'Type' },
    { key: 'Quantity', label: 'Quantity' },
    { key: 'DietPref', label: 'Diet Prefe..' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={{ flex: 1, backgroundColor: theme.colors.text + '55' }} onPress={onClose} />
      <View style={{ 
        position: 'absolute', 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: '#fff', 
        borderTopLeftRadius: 18, 
        borderTopRightRadius: 18, 
        minHeight: 480, 
        maxHeight: '85%' 
      }}>
        {/* Top Bar */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: 16, 
          borderBottomWidth: 1, 
          borderBottomColor: '#eee' 
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222' }}>Filters</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#222" />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flex: 1 }}>
          {/* Left: Tabs */}
          <View style={{ 
            width: 110, 
            backgroundColor: '#F8F8F8', 
            borderRightWidth: 1, 
            borderRightColor: '#eee', 
            paddingVertical: 8 
          }}>
            {filterTabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={{ 
                  paddingVertical: 14, 
                  paddingHorizontal: 10, 
                  backgroundColor: selectedFilterTab === tab.key ? '#fff' : 'transparent', 
                  borderLeftWidth: 3, 
                  borderLeftColor: selectedFilterTab === tab.key ? '#1A7B50' : 'transparent' 
                }}
                onPress={() => setSelectedFilterTab(tab.key)}
              >
                <Text style={{ 
                  color: selectedFilterTab === tab.key ? '#1A7B50' : '#222', 
                  fontWeight: selectedFilterTab === tab.key ? 'bold' : 'normal', 
                  fontSize: 15 
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Right: Filter Options */}
          <View style={{ flex: 1, padding: 16 }}>
            {selectedFilterTab === 'Brand' && (
              <>
                <View style={{ 
                  backgroundColor: '#F4F4F4', 
                  borderRadius: 8, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  marginBottom: 12, 
                  paddingHorizontal: 8 
                }}>
                  <MaterialCommunityIcons name="magnify" size={18} color="#888" />
                  <TextInput
                    style={{ flex: 1, height: 36, fontSize: 15, marginLeft: 6 }}
                    placeholder="Search"
                    placeholderTextColor="#aaa"
                    value={brandSearch}
                    onChangeText={setBrandSearch}
                  />
                </View>
                <ScrollView style={{ maxHeight: 260 }}>
                  {allBrands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())).map((brand) => (
                    <TouchableOpacity
                      key={brand}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
                      onPress={() => {
                        setSelectedBrands(
                          selectedBrands.includes(brand)
                            ? selectedBrands.filter((b) => b !== brand)
                            : [...selectedBrands, brand]
                        );
                      }}
                    >
                      <MaterialCommunityIcons
                        name={selectedBrands.includes(brand) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={22}
                        color={selectedBrands.includes(brand) ? '#1A7B50' : '#888'}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={{ color: '#222', fontSize: 15 }}>{brand}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            {/* Add similar blocks for other tabs (Type, Quantity, DietPref) as needed */}
          </View>
        </View>
        {/* Bottom Buttons */}
        {/* <View style={{ 
          flexDirection: 'row', 
          borderTopWidth: 1, 
          borderTopColor: '#eee', 
          padding: 12, 
          backgroundColor: '#fff', 
          // Apply some space below the buttons
          paddingBottom: 12 + insets.bottom,
        }}>
          <TouchableOpacity 
            style={{ 
              flex: 1, 
              backgroundColor: '#F4F4F4', 
              borderRadius: 8, 
              paddingVertical: 12, 
              alignItems: 'center', 
              marginRight: 8,
              height: 100,
            }} 
            onPress={clearAllFilters}
          >
            <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 15 }}>Clear filters</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ 
              flex: 1, 
              backgroundColor: '#1A7B50', 
              borderRadius: 8, 
              paddingVertical: 12, 
              alignItems: 'center' 
            }} 
            onPress={onClose}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Apply</Text>
          </TouchableOpacity>
        </View> */}

      </View>
    </Modal>
  );
};

export default FilterModal;