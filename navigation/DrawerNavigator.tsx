import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

const Drawer = createDrawerNavigator();

const AccountScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Account Screen</Text></View>;
const OffersScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Offers Screen</Text></View>;
const SupportScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Support Screen</Text></View>;
const SettingsScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Settings Screen</Text></View>;
const LogoutScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Logout Screen</Text></View>;
const CartScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Cart Screen</Text></View>;

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={({ route }) => ({
        drawerIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'person';

          if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Offers') {
            iconName = focused ? 'gift' : 'gift-outline';
          } else if (route.name === 'Support') {
            iconName = focused ? 'help-circle' : 'help-circle-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Logout') {
            iconName = focused ? 'log-out' : 'log-out-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Drawer.Screen name="Account" component={AccountScreen} />
      <Drawer.Screen name="Offers" component={OffersScreen} />
      <Drawer.Screen name="Support" component={SupportScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Logout" component={LogoutScreen} />
      <Drawer.Screen name="Cart" component={CartScreen} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator; 