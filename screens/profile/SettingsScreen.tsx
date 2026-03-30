import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../contexts/AppContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SettingsScreen = () => {
  const { theme, toggleTheme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { selectedStore } = useAppContext();




  const handleHelpCenter = () => {
    navigation.navigate('HelpCenter' as any);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginLeft: 16,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    menuIcon: {
      marginRight: 16,
    },
    menuText: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    chevron: {
      marginLeft: 8,
    },
    currentStoreInfo: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    storeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    currentStoreTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginLeft: 8,
    },
    currentStoreName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    storeType: {
      fontSize: 14,
      color: theme.colors.secondary,
      textTransform: 'capitalize',
    },
    themeSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    themeContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    themeTextContainer: {
      flex: 1,
    },
    themeText: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 2,
    },
    themeDescription: {
      fontSize: 12,
    },
    toggleIndicator: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={{ height: 20}}></View>

      <ScrollView style={styles.content}>
        {/* Current Store Info */}
        {selectedStore && (
          <View style={styles.currentStoreInfo}>
            <View style={styles.storeHeader}>
              <MaterialCommunityIcons name="store" size={24} color={theme.colors.primary} />
              <Text style={styles.currentStoreTitle}>Current Store</Text>
            </View>
            <Text style={styles.currentStoreName}>{selectedStore.name}</Text>
            <Text style={styles.storeType}>{selectedStore.type === 'grocery' ? 'Grocery Store' : 'Pharmacy Store'}</Text>
          </View>
        )}


        {/* Account & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Support</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleHelpCenter}>
            <MaterialCommunityIcons 
              name="help-circle" 
              size={24} 
              color={theme.colors.primary} 
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>Help Center</Text>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={24} 
              color={theme.colors.secondary}
              style={styles.chevron}
            />
          </TouchableOpacity>
        </View>

        {/* Theme Toggle Section */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <TouchableOpacity 
            style={[styles.themeSection, { backgroundColor: theme.colors.surface }]}
            onPress={() => {
              console.log('🎨 Theme toggle pressed! Current theme:', theme.dark ? 'dark' : 'light');
              toggleTheme();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.themeContent}>
              <View style={styles.themeTextContainer}>
                <Text style={[styles.themeText, { color: theme.colors.text }]}>Dark Mode</Text>
                <Text style={[styles.themeDescription, { color: theme.colors.secondary }]}>Toggle app theme</Text>
              </View>
              <MaterialCommunityIcons 
                name="theme-light-dark" 
                size={24} 
                color={theme.colors.primary} 
              />
            </View>
            <View style={styles.toggleIndicator}>
              <MaterialCommunityIcons 
                name={theme.dark ? "toggle-switch" : "toggle-switch-off"}
                size={32}
                color={theme.dark ? theme.colors.primary : theme.colors.secondary}
              />
            </View>
          </TouchableOpacity>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
