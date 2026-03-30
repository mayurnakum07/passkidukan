import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Store {
  id: string;
  name: string;
}

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface StorageContextType {
  selectedStore: Store | null;
  setSelectedStore: (store: Store | null) => void;
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  appSection: string | null;
  setAppSection: (section: string | null) => void;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [appSection, setAppSection] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Clear app state on every startup to ensure fresh restart
        console.log('🔄 App restarting - clearing previous state');
        
        // Load only essential data, clear store selection to force fresh start
        const userData = await AsyncStorage.getItem('user');
        const sectionData = await AsyncStorage.getItem('appSection');

        // Don't load selectedStore on startup - let app initialize fresh
        // if (storeData) setSelectedStore(JSON.parse(storeData));
        // Don't load cart on startup - start fresh
        // if (cartData) setCart(JSON.parse(cartData));
        
        if (userData) setUser(JSON.parse(userData));
        
        // Default to pharmacy section regardless of saved section to ensure clean start
        // if (sectionData) {
        //   setAppSection(sectionData);
        // } else {
          // Set default to pharmacy
          console.log('🔄 Setting default app section to pharma');
          setAppSection('pharma');
          await AsyncStorage.setItem('appSection', 'pharma');
        // }
      } catch (error) {
        console.error('Error loading data from AsyncStorage:', error);
        // Set default to pharmacy on error
        setAppSection('pharma');
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('selectedStore', JSON.stringify(selectedStore));
        await AsyncStorage.setItem('cart', JSON.stringify(cart));
        await AsyncStorage.setItem('user', JSON.stringify(user));
        if (appSection) await AsyncStorage.setItem('appSection', appSection);
      } catch (error) {
        console.error('Error saving data to AsyncStorage:', error);
      }
    };

    saveData();
  }, [selectedStore, cart, user, appSection]);

  return (
    <StorageContext.Provider value={{ selectedStore, setSelectedStore, cart, setCart, user, setUser, appSection, setAppSection }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}; 