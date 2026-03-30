import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import authService from '../../services/api/authService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;
type RegisterRouteProp = RouteProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RegisterRouteProp>();
  const { phoneNumber, cartType } = route.params;
  const { theme } = useTheme();
  const { register } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📝 Starting registration process...');
      console.log('📱 Phone Number:', phoneNumber);
      console.log('👤 User Data:', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      
      // Call register API first to get otpKey
      const response = await authService.registerUser({
        mobile: phoneNumber,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });

      console.log('📡 Register API Response:', JSON.stringify(response, null, 2));

      if (!response.success || !response.data?.otpKey) {
        console.log('  Registration failed:', response.error);
        Alert.alert('Error', response.error || 'Registration failed. Please try again.');
        setIsLoading(false);
        return;
      }

      const otpKey = response.data.otpKey;
      console.log(' Registration successful, otpKey received:', otpKey);

      // Navigate to OTP verification with otpKey
      console.log('🔄 Navigating to OTP verification...');
      navigation.replace('OTPVerification', { 
        phoneNumber,
        cartType,
        isRegistration: true,
        otpKey: otpKey,
        userData: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
        }
      });
    } catch (error) {
      console.error('💥 Error during registration:', error);
      Alert.alert('Error', 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    header: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.secondary,
      marginBottom: theme.spacing.lg,
    },
    phoneDisplay: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.xl,
    },
    phoneText: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    registerButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    },
    registerButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    disabledButton: {
      backgroundColor: theme.colors.secondary,
      opacity: 0.5,
    },
    termsText: {
      fontSize: 14,
      color: theme.colors.text + '80',
      textAlign: 'center',
      marginTop: 20,
      lineHeight: 20,
    },
  });

  const isFormValid = firstName.trim() && lastName.trim() && email.trim() && !isLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Registration</Text>
            <Text style={styles.subtitle}>
              Please provide your details to complete the registration
            </Text>
          </View>

          <View style={styles.phoneDisplay}>
            <Text style={styles.phoneText}>Mobile: {phoneNumber}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your first name"
              value={firstName}
              onChangeText={setFirstName}
              placeholderTextColor={theme.colors.secondary}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your last name"
              value={lastName}
              onChangeText={setLastName}
              placeholderTextColor={theme.colors.secondary}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor={theme.colors.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.registerButton,
              !isFormValid && styles.disabledButton,
            ]}
            onPress={handleRegister}
            disabled={!isFormValid}
          >
            <Text style={styles.registerButtonText}>Continue to Verification</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay 
        visible={isLoading} 
        message="Proceeding..." 
      />
    </SafeAreaView>
  );
};

export default RegisterScreen; 