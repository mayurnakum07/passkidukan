import React from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { Text, Card, Button, Avatar, VStack, HStack } from 'native-base';
import { useAppTheme } from '../../hooks/useAppTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ProfileSectionProps {
  scrollY: Animated.Value;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ scrollY }) => {
  const { colors, typography, spacing, borderRadius, createStyles } = useAppTheme();

  const styles = createStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondary,
    },
    title: {
      ...typography.h1,
      color: colors.text,
    },
    content: {
      padding: spacing.lg,
    },
    profileCard: {
      marginBottom: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
    },
    profileContent: {
      alignItems: 'center',
      padding: spacing.xl,
    },
    avatar: {
      marginBottom: spacing.md,
      backgroundColor: colors.primary,
    },
    name: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    email: {
      ...typography.body1,
      color: colors.text,
      opacity: 0.7,
    },
    menuCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
    },
    menuItem: {
      paddingVertical: spacing.sm,
    },
    menuIcon: {
      marginRight: spacing.md,
    },
    logoutButton: {
      marginTop: spacing.xl,
    },
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.header, {
        transform: [{
          translateY: scrollY.interpolate({
            inputRange: [0, 100],
            outputRange: [0, -100],
            extrapolate: 'clamp',
          }),
        }],
      }]}>
        <Text style={styles.title}>Profile</Text>
      </Animated.View>
      <ScrollView style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.profileContent}>
            <Avatar
              size={80}
              style={styles.avatar}
            >
              <Text>JD</Text>
            </Avatar>
            <Text style={styles.name}>John Doe</Text>
            <Text style={styles.email}>john.doe@example.com</Text>
          </View>
        </Card>

        <Card style={styles.menuCard}>
          <VStack space={2} p={4}>
            <HStack space={3} alignItems="center" p={2}>
              <MaterialCommunityIcons name="package-variant" size={24} color={colors.primary} />
              <Text style={styles.menuItem}>My Orders</Text>
            </HStack>
            <HStack space={3} alignItems="center" p={2}>
              <MaterialCommunityIcons name="map-marker" size={24} color={colors.primary} />
              <Text style={styles.menuItem}>Delivery Addresses</Text>
            </HStack>
            <HStack space={3} alignItems="center" p={2}>
              <MaterialCommunityIcons name="credit-card" size={24} color={colors.primary} />
              <Text style={styles.menuItem}>Payment Methods</Text>
            </HStack>
            <HStack space={3} alignItems="center" p={2}>
              <MaterialCommunityIcons name="bell" size={24} color={colors.primary} />
              <Text style={styles.menuItem}>Notifications</Text>
            </HStack>
            <HStack space={3} alignItems="center" p={2}>
              <MaterialCommunityIcons name="help-circle" size={24} color={colors.primary} />
              <Text style={styles.menuItem}>Help & Support</Text>
            </HStack>
          </VStack>
        </Card>

        <Button
          variant="outline"
          onPress={() => {}}
          style={styles.logoutButton}
          colorScheme="primary"
          size="lg"
        >
          Log Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileSection; 