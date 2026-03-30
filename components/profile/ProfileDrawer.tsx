import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useCallback } from 'react';

interface DrawerProps {
  onClose: () => void;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Drawer: React.FC<DrawerProps> = ({ onClose }) => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const slideAnim = useRef(new Animated.Value(-320)).current;

  // Debug logging
  console.log('🔍 ProfileDrawer Debug:', {
    isAuthenticated,
    user: user ? {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile
    } : 'null',
    hasUser: !!user
  });

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    // Refresh user data when drawer opens
    if (isAuthenticated && !user) {
      console.log('🔄 Refreshing user data in drawer...');
      refreshUser();
    }
  }, [isAuthenticated, user, refreshUser]);

  // Refresh user data when drawer opens (additional check)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log('🔄 Drawer focused - refreshing user data...');
        refreshUser();
      }
    }, [isAuthenticated, refreshUser])
  );

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -320,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleLoginPress = () => {
    onClose();
    navigation.navigate('PhoneAuth', { cartType: 'grocery' });
  };

  const handleRegisterPress = () => {
    onClose();
    navigation.navigate('PhoneAuth', { cartType: 'grocery' });
  };

  const handleMyOrdersPress = () => {
    onClose();
    navigation.navigate('Orders' as any);
  };

  const handleAddressListPress = () => {
    onClose();
    navigation.navigate('MyAddresses' as any);
  };

  const handleMyProfilePress = () => {
    onClose();
    navigation.navigate('EditProfile' as any);
  };

  const handleMyWishlistPress = () => {
    onClose();
    navigation.navigate('MyWishlist' as any);
  };

  const handleAboutStorePress = () => {
    onClose();
    navigation.navigate('AboutStore' as any);
  };

  const handleContactStorePress = () => {
    onClose();
    navigation.navigate('ContactStore' as any);
  };

  const handleLocateStorePress = () => {
    onClose();
    // navigation.navigate('LocateStore' as any);
    console.log('Locate store pressed');
  };

  const handleShareAppPress = () => {
    onClose();
    // Share app functionality - can be implemented later
    console.log('Share app pressed');
  };

  const handleAboutPassKiDukaanPress = () => {
    onClose();
    // navigation.navigate('AboutPassKiDukaan' as any);
    console.log('About Pass ki Dukaan pressed');
  };

  const handleChangeStorePress = () => {
    onClose();
    navigation.navigate('Pincode');
  };

  const handleSettingsPress = () => {
    onClose();
    navigation.navigate('Settings' as any);
  };

  const handleNotificationsPress = () => {
    onClose();
    // navigation.navigate('Notifications' as any);

    console.log('Notifications pressed');};

  const handleLogoutPress = async () => {
    onClose();
    await logout();
  };

  // Menu sections for authenticated users
  const authenticatedMenuSections = [
    {
      key: 'main',
      items: [
        { icon: 'clipboard-list', label: 'My Orders', onPress: handleMyOrdersPress },
        { icon: 'map-marker', label: 'Address List', onPress: handleAddressListPress },
        { icon: 'account', label: 'My Profile', onPress: handleMyProfilePress },
        // { icon: 'heart', label: 'My Wishlist', onPress: handleMyWishlistPress },
      ],
    },
    {
      key: 'store',
      items: [
        { icon: 'store', label: 'About Store', onPress: handleAboutStorePress },
      ],
    },
    {
      key: 'app',
      items: [
        { icon: 'share-variant', label: 'Share this App', onPress: handleShareAppPress },
        // { icon: 'information', label: 'About Pass ki Dukaan', onPress: handleAboutPassKiDukaanPress },
      ],
    },
    {
      key: 'settings',
      items: [
        { icon: 'store-edit', label: 'Change Store', onPress: handleChangeStorePress },
        { icon: 'cog', label: 'Settings', onPress: handleSettingsPress },
        // { icon: 'bell', label: 'Notifications', onPress: handleNotificationsPress },
        { icon: 'logout', label: 'Logout', onPress: handleLogoutPress },
      ],
    },
  ];

  // Menu sections for non-authenticated users
  const nonAuthenticatedMenuSections = [
    {
      key: 'auth',
      items: [
        { icon: 'login', label: 'Login / Sign Up', onPress: handleLoginPress },
      ],
    },
    {
      key: 'store',
      items: [
        { icon: 'store-edit', label: 'Change Store', onPress: handleChangeStorePress },
        { icon: 'store', label: 'About Store', onPress: handleAboutStorePress },
      ],
    },
    {
      key: 'app',
      items: [
        { icon: 'share-variant', label: 'Share this App', onPress: handleShareAppPress },
        // { icon: 'information', label: 'About Pass ki Dukaan', onPress: handleAboutPassKiDukaanPress },
      ],
    },
  ];

  const menuSections = isAuthenticated ? authenticatedMenuSections : nonAuthenticatedMenuSections;
  
  // Debug logging for menu sections
  console.log('🔍 ProfileDrawer Menu Debug:', {
    isAuthenticated,
    hasUser: !!user,
    menuSectionsLength: menuSections.length,
    currentMenuSections: menuSections.map(s => ({ key: s.key, itemsCount: s.items.length, items: s.items.map(i => i.label) }))
  });

  const renderMenuSection = (section: any, idx: number) => (
    <View
      key={section.key}
      style={[
        styles.sectionContainer,
        { backgroundColor: theme.colors.surface },
        idx > 0 && { marginTop: 18 },
      ]}
    >
      {section.items.map((item: any, index: number) => (
        <TouchableOpacity
          key={item.label}
          style={[
            styles.menuItem,
            // Remove borderBottom for a cleaner look
            // index !== section.items.length - 1 && { borderBottomColor: '#F2F2F2', borderBottomWidth: 1 },
          ]}
          onPress={item.onPress}
        >
          <MaterialCommunityIcons name={item.icon} size={24} color={theme.colors.primary} />
          <Text style={[styles.menuText, { color: theme.colors.text }]}>{item.label}</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background,
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {isAuthenticated && user?.firstName
            ? `Hello, ${user.firstName}`
            : 'Welcome'}
        </Text>
      </View>

      {/* User Profile Section for authenticated users */}
      {isAuthenticated && user && (
        <TouchableOpacity 
          style={[styles.userProfileSection, { backgroundColor: theme.colors.surface }]}
          onPress={handleMyProfilePress}
        >
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {user.firstName} {user.lastName}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.secondary }]}>
                {user.email}
              </Text>
              <Text style={[styles.userMobile, { color: theme.colors.secondary }]}>
                +91 {user.mobile}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuSections.map(renderMenuSection)}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    paddingTop: 25, // Reduced from 40 to 25
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    // No borderBottom for a cleaner look
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
  },
  separator: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  themeToggleBottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContainer: {
    borderRadius: 12,
    marginHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
    // backgroundColor set dynamically
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  userProfileSection: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  userMobile: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default Drawer;