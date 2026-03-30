// contexts/CartContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetApp } from '../utils/resetApp';

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number; // Optional original price for MRP/discount
  image: string;
  quantity: number;
  category: 'grocery' | 'pharma';
  variant?: {
    name: string;
    unit: string;
  };
  // Store the actual product ID that the API expects for order placement
  productId?: string;
  // Prescription requirement
  prescriptionRequired?: boolean;
}

interface CartContextType {
  groceryItems: CartItem[];
  pharmacyItems: CartItem[];
  addToGroceryCart: (product: Omit<CartItem, 'quantity' | 'category'>) => void;
  addToPharmacyCart: (product: Omit<CartItem, 'quantity' | 'category'>) => void;
  removeFromCart: (productId: string, category: 'grocery' | 'pharma') => void;
  updateQuantity: (productId: string, newQuantity: number, category: 'grocery' | 'pharma') => void;
  groceryTotal: number;
  pharmacyTotal: number;
  totalItems: number;
  clearCart: (resetAll?: boolean) => void;
  resetAllContexts: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  groceryItems: [],
  pharmacyItems: [],
  addToGroceryCart: () => {},
  addToPharmacyCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  groceryTotal: 0,
  pharmacyTotal: 0,
  totalItems: 0,
  clearCart: () => {},
  resetAllContexts: async () => {},
});

export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [groceryItems, setGroceryItems] = useState<CartItem[]>([]);
  const [pharmacyItems, setPharmacyItems] = useState<CartItem[]>([]);

  // Load cart items from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedGroceryCart = await AsyncStorage.getItem('groceryCart');
        const savedPharmacyCart = await AsyncStorage.getItem('pharmacyCart');
        if (savedGroceryCart) {
          setGroceryItems(JSON.parse(savedGroceryCart));
        }
        if (savedPharmacyCart) {
          setPharmacyItems(JSON.parse(savedPharmacyCart));
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };
    loadCart();
  }, []);

  // Save cart items to AsyncStorage whenever they change
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('groceryCart', JSON.stringify(groceryItems));
        await AsyncStorage.setItem('pharmacyCart', JSON.stringify(pharmacyItems));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };
    saveCart();
  }, [groceryItems, pharmacyItems]);

  const addToGroceryCart = (product: Omit<CartItem, 'quantity' | 'category'>) => {
    // Ensure product has a name
    const normalizedProduct = {
      ...product,
      name: product.name || 'Unnamed Product',
    };
    
    console.log('🛒 addToGroceryCart called:', normalizedProduct);
    setGroceryItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === normalizedProduct.id);
      if (existingItem) {
        console.log('🛒 Existing item found, incrementing quantity:', existingItem.name);
        return prevItems.map(item =>
          item.id === normalizedProduct.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      console.log('🛒 New item, adding to cart:', { ...normalizedProduct, quantity: 1, category: 'grocery' });
      return [...prevItems, { ...normalizedProduct, quantity: 1, category: 'grocery' }];
    });
  };

  const addToPharmacyCart = (product: Omit<CartItem, 'quantity' | 'category'>) => {
    // Ensure product has a name
    const normalizedProduct = {
      ...product,
      name: product.name || 'Unnamed Product',
    };
    
    console.log('🛒 addToPharmacyCart called:', normalizedProduct);
    setPharmacyItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === normalizedProduct.id);
      if (existingItem) {
        console.log('🛒 Existing item found, incrementing quantity:', existingItem.name);
        return prevItems.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      console.log('🛒 New item, adding to cart:', { ...product, quantity: 1, category: 'pharma' });
      return [...prevItems, { ...product, quantity: 1, category: 'pharma' }];
    });
  };

  const removeFromCart = (productId: string, category: 'grocery' | 'pharma') => {
    console.log('🛒 removeFromCart called:', { productId, category });
    if (category === 'grocery') {
      setGroceryItems(prevItems => {
        console.log('🛒 Removing from grocery, prev items:', prevItems.length);
        const filtered = prevItems.filter(item => item.id !== productId);
        console.log('🛒 After removal, items:', filtered.length);
        return filtered;
      });
    } else {
      setPharmacyItems(prevItems => {
        console.log('🛒 Removing from pharmacy, prev items:', prevItems.length);
        const filtered = prevItems.filter(item => item.id !== productId);
        console.log('🛒 After removal, items:', filtered.length);
        return filtered;
      });
    }
  };

  const updateQuantity = (productId: string, newQuantity: number, category: 'grocery' | 'pharma') => {
    console.log('🛒 updateQuantity called:', { productId, newQuantity, category });
    
    // Remove from cart if quantity is 0 or negative
    if (newQuantity <= 0) {
      console.log('🛒 Quantity <= 0, removing from cart');
      removeFromCart(productId, category);
      return;
    }
    
    if (category === 'grocery') {
      setGroceryItems(prevItems => {
        console.log('🛒 Updating grocery quantity, prev items:', prevItems.length);
        return prevItems.map(item =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        );
      });
    } else {
      setPharmacyItems(prevItems => {
        console.log('🛒 Updating pharmacy quantity, prev items:', prevItems.length);
        return prevItems.map(item =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        );
      });
    }
  };

  const clearCart = async (resetAll: boolean = false) => {
    try {
      console.log('🧹 Clearing cart from context...');
      setGroceryItems([]);
      setPharmacyItems([]);
      
      if (resetAll) {
        console.log('🔄 Reset all requested, clearing all contexts...');
        await resetAllContexts();
      } else {
        // Just clear cart data
        await AsyncStorage.removeItem('grocery_cart');
        await AsyncStorage.removeItem('pharmacy_cart');
        console.log(' Cart cleared from context and AsyncStorage');
      }
    } catch (error) {
      console.error('  Error clearing cart:', error);
    }
  };

  const resetAllContexts = async () => {
    try {
      console.log('🔄 Resetting all app contexts...');
      
      // Use the comprehensive reset utility
      await resetApp();
      
      // Reset local state
      setGroceryItems([]);
      setPharmacyItems([]);
      
      console.log(' All app contexts reset successfully');
      
    } catch (error) {
      console.error('  Error resetting all contexts:', error);
    }
  };

  const groceryTotal = Math.round(groceryItems.reduce(
    (total, item) => total + (item.quantity > 0 ? item.price * item.quantity : 0),
    0
  ) * 100) / 100;

  const pharmacyTotal = Math.round(pharmacyItems.reduce(
    (total, item) => total + (item.quantity > 0 ? item.price * item.quantity : 0),
    0
  ) * 100) / 100;

  const totalItems = groceryItems.reduce(
    (count, item) => count + (item.quantity > 0 ? item.quantity : 0),
    0
  ) + pharmacyItems.reduce(
    (count, item) => count + (item.quantity > 0 ? item.quantity : 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        groceryItems,
        pharmacyItems,
        addToGroceryCart,
        addToPharmacyCart,
        removeFromCart,
        updateQuantity,
        groceryTotal,
        pharmacyTotal,
        totalItems,
        clearCart,
        resetAllContexts,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
