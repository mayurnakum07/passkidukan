import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { useCallback } from 'react';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

const ProfileScreen = () => {
  const { theme } = useTheme();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  
  // Debug logging
  console.log('🔍 ProfileScreen Debug:', {
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
    // Refresh user data when screen loads
    if (isAuthenticated && !user) {
      console.log('🔄 Refreshing user data in ProfileScreen...');
      refreshUser();
    }
  }, [isAuthenticated, user, refreshUser]);

  // Refresh user data when screen comes into focus (e.g., after login)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log('🔄 ProfileScreen focused - refreshing user data...');
        refreshUser();
      }
    }, [isAuthenticated, refreshUser])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.navigate('Splash');
          }
        }
      ]
    );
  };

  const profileOptions = [
    { 
      id: '1', 
      name: 'Edit Profile', 
      icon: 'person-outline' as const, 
      screen: 'EditProfile' as keyof RootStackParamList,
      description: 'Update your personal information'
    },
  ];


  const handleOptionPress = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen as any);
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.centerContainer}>
          <Ionicons name="person-circle-outline" size={80} color={theme.colors.secondary} />
          <Text style={[styles.noUserText, { color: theme.colors.text }]}>
            Please login to view your profile
          </Text>
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('PhoneAuth', { cartType: 'grocery' })}
          >
            <Text style={styles.loginButtonText}>Login / Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.profileInfo}>
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
          <TouchableOpacity 
            style={[styles.editButton, { borderColor: theme.colors.primary }]}
            onPress={() => handleOptionPress('EditProfile')}
          >
            <Ionicons name="pencil" size={16} color={theme.colors.primary} />
            <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Profile</Text>
          {profileOptions.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={[styles.optionItem, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleOptionPress(option.screen)}
            >
              <Ionicons name={option.icon} size={24} color={theme.colors.primary} />
              <View style={styles.optionContent}>
                <Text style={[styles.optionText, { color: theme.colors.text }]}>{option.name}</Text>
                <Text style={[styles.optionDescription, { color: theme.colors.secondary }]}>{option.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.secondary} />
            </TouchableOpacity>
          ))}
        </View>



        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: theme.colors.error }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noUserText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    padding: 20,
    margin: 16,
    marginTop: 100,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  userMobile: {
    fontSize: 14,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  optionContent: {
    flex: 1,
    marginLeft: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileScreen; 