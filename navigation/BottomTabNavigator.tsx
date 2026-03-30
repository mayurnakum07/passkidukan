import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { View, Text, Alert, StyleSheet } from "react-native";
import HomeScreen from "../screens/home/HomeScreen";
import OrdersScreen from "../screens/order/OrdersScreen";
// import PharmacyHomeScreen from "../screens/home/PharmacyHomeScreen";
import { useTheme } from "../contexts/ThemeContext";
import CategoryDetailScreen from "../screens/category/CategoryDetailScreen";
import CategoriesScreen from "../screens/category/CategoriesScreen";
import ProductDetailScreen from "../screens/product/ProductDetailScreen";
import GreatOffersScreen from "../screens/home/GreatOffersScreen";
import CartScreen from "../screens/cart/CartScreen";
import RecentlyBoughtScreen from "../screens/profile/RecentlyBoughtScreen";
import BrandsScreen from "../screens/category/BrandsScreen";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "./types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAppContext } from "../contexts/AppContext";
import { useCart } from "../contexts/CartContext";

const getTabBarStyle = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? "";

  if (routeName === "ProductDetail" || routeName === "MedicineDetail") {
    return { display: "none" };
  }

  return { display: "flex" };
};
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const PharmacyStack = createNativeStackNavigator();

type NavigationProp = StackNavigationProp<RootStackParamList>;

const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeRoot" component={HomeScreen} />
    <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
    <HomeStack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
    <HomeStack.Screen name="GreatOffersScreen" component={GreatOffersScreen} />
    <HomeStack.Screen name="Cart" component={CartScreen} />
    {/* <HomeStack.Screen
      name="RecentlyBoughtScreen"
      component={RecentlyBoughtScreen}
    /> */}
    <HomeStack.Screen name="BrandsScreen" component={BrandsScreen} />
    <HomeStack.Screen name="CategoriesScreen" component={CategoriesScreen} />
  </HomeStack.Navigator>
);

const OrdersStackNavigator = () => (
  <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
    <OrdersStack.Screen name="OrdersRoot" component={OrdersScreen} />
  </OrdersStack.Navigator>
);

const PharmacyStackNavigator = () => (
  <PharmacyStack.Navigator screenOptions={{ headerShown: false }}>
    {/* <PharmacyStack.Screen name="PharmacyRoot" component={PharmacyHomeScreen} /> */}
    <PharmacyStack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
    />
    <PharmacyStack.Screen
      name="CategoryDetail"
      component={CategoryDetailScreen}
    />
    {/* <PharmacyStack.Screen
      name="GreatOffersScreen"
      component={GreatOffersScreen}
    /> */}
    <PharmacyStack.Screen name="Cart" component={CartScreen} />
    <PharmacyStack.Screen
      name="RecentlyBoughtScreen"
      component={RecentlyBoughtScreen}
    />
    <PharmacyStack.Screen name="BrandsScreen" component={BrandsScreen} />
    <PharmacyStack.Screen
      name="CategoriesScreen"
      component={CategoriesScreen}
    />
  </PharmacyStack.Navigator>
);

const BottomTabNavigator = () => {
  const { section, setSection } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const {
    lastVisitedGroceryStore,
    lastVisitedPharmacyStore,
    setSelectedStore,
    saveLastVisitedStore,
    loadLastVisitedGroceryStore,
    loadLastVisitedPharmacyStore,
  } = useAppContext();
  const { clearCart, groceryItems, pharmacyItems } = useCart();

  // Calculate total cart items count
  const getCartItemCount = () => {
    const totalGrocery = groceryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPharmacy = pharmacyItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    return totalGrocery + totalPharmacy;
  };

  const cartItemCount = getCartItemCount();

  const handleGroceryTabPress = async (e: any) => {
    e.preventDefault();
    
    // Check if switching from pharmacy to grocery and if cart has items
    const hasCartItems = groceryItems.some(item => item.quantity > 0) || pharmacyItems.some(item => item.quantity > 0);
    const isSwitchingSection = section === "pharma"; // Currently in pharma, switching to grocery
    
    if (isSwitchingSection && hasCartItems) {
      // Show confirmation dialog
      Alert.alert(
        'Change Store',
        'If you change the store, your products added into cart will be deleted',
        [
          { text: 'Cancel', onPress: () => {} },
          {
            text: 'Proceed',
            onPress: async () => {
              await clearCart();
              proceedWithGrocerySwitch();
            },
            style: 'destructive'
          }
        ]
      );
    } else {
      proceedWithGrocerySwitch();
    }
  };

  const proceedWithGrocerySwitch = async () => {
    setSection("grocery");

    // Reload grocery store from storage to ensure we have latest
    const groceryStore = await loadLastVisitedGroceryStore();

    // Check if last visited grocery store exists
    if (groceryStore && groceryStore.id) {
      console.log("🛒 Opening last visited grocery store:", groceryStore);
      setSelectedStore(groceryStore);
      saveLastVisitedStore(groceryStore);

      // Navigate directly to Home with the store
      navigation.navigate("Main", {
        screen: "Home",
        params: {
          screen: "HomeRoot",
          params: {
            storeId: groceryStore.id,
            pincode: groceryStore.pincode,
            storeType: "grocery",
            storeName: groceryStore.name,
          },
        },
      });
    } else {
      console.log(
        "🛒 No last visited grocery store found, proceeding to location flow",
      );
      // No last visited grocery store, proceed to location flow
      navigation.navigate("Pincode" as any);
    }
  };

  const handlePharmacyTabPress = async (e: any) => {
    e.preventDefault();
    
    // Check if switching from grocery to pharmacy and if cart has items
    const hasCartItems = groceryItems.some(item => item.quantity > 0) || pharmacyItems.some(item => item.quantity > 0);
    const isSwitchingSection = section === "grocery"; // Currently in grocery, switching to pharma
    
    if (isSwitchingSection && hasCartItems) {
      // Show confirmation dialog
      Alert.alert(
        'Change Store',
        'If you change the store your products added into th ecart will be deleted',
        [
          { text: 'Cancel', onPress: () => {} },
          {
            text: 'Proceed',
            onPress: async () => {
              await clearCart();
              proceedWithPharmacySwitch();
            },
            style: 'destructive'
          }
        ]
      );
    } else {
      proceedWithPharmacySwitch();
    }
  };

  const proceedWithPharmacySwitch = async () => {
    setSection("pharma");

    // Reload pharmacy store from storage to ensure we have latest
    const pharmacyStore = await loadLastVisitedPharmacyStore();

    // Check if last visited pharmacy store exists
    if (pharmacyStore && pharmacyStore.id) {
      console.log("💊 Opening last visited pharmacy store:", pharmacyStore);
      setSelectedStore(pharmacyStore);
      saveLastVisitedStore(pharmacyStore);

      // Navigate directly to Pharmacy Home with the store
      navigation.navigate("Main", {
        screen: "Home",
        params: {
          screen: "HomeRoot",
          params: {
            storeId: pharmacyStore.id,
            pincode: pharmacyStore.pincode,
            storeType: "pharma",
            storeName: pharmacyStore.name,
          },
        },
      });
    } else {
      console.log(
        "💊 No last visited pharmacy store found, proceeding to location flow",
      );
      // No last visited pharmacy store, proceed to location flow
      navigation.navigate("Pincode" as any);
    }
  };

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarStyle: getTabBarStyle(route) as any,
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Order Again") {
            iconName = focused ? "repeat" : "repeat-outline";
          } else if (route.name === "Cart") {
            iconName = focused ? "cart" : "cart-outline";

            return (
              <View>
                <Ionicons
                  name={iconName}
                  size={focused ? size + 8 : size + 8}
                  color={focused ? "#2ecc71" : "#27ae60"}
                />
                {cartItemCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </Text>
                  </View>
                )}
              </View>
            );
          } else if (route.name === "Categories") {
            iconName = focused ? "apps" : "apps-outline";
          } else if (route.name === "Pharmacy" || route.name === "Grocery") {
            iconName =
              section === "grocery"
                ? focused
                  ? "medical"
                  : "medical-outline"
                : focused
                  ? "basket"
                  : "basket-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Order Again" component={OrdersStackNavigator} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />

      {section === "grocery" ? (
        <Tab.Screen
          name="Pharmacy"
          component={HomeStackNavigator}
          listeners={{ tabPress: handlePharmacyTabPress }}
        />
      ) : (
        <Tab.Screen
          name="Grocery"
          component={HomeStackNavigator}
          listeners={{ tabPress: handleGroceryTabPress }}
        />
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default BottomTabNavigator;