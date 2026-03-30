import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WISHLIST_STORAGE_KEY = 'app_wishlist';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  originalPrice?: number;
  brand?: string;
  inStock?: boolean;
  [key: string]: any;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setWishlistItems(Array.isArray(parsed) ? parsed : []);
        }
      } catch (e) {
        console.warn('Wishlist load error:', e);
      }
      setLoaded(true);
    };
    load();
  }, []);

  const persist = useCallback(async (items: WishlistItem[]) => {
    try {
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Wishlist persist error:', e);
    }
  }, []);

  const addToWishlist = useCallback(async (item: WishlistItem) => {
    const normalized: WishlistItem = {
      id: item.id,
      name: item.name,
      price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
      image: item.image,
      originalPrice: item.originalPrice,
      brand: item.brand,
      inStock: item.inStock !== false,
    };
    setWishlistItems(prev => {
      if (prev.some(i => i.id === normalized.id)) return prev;
      const next = [...prev, normalized];
      persist(next);
      return next;
    });
  }, [persist]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    setWishlistItems(prev => {
      const next = prev.filter(i => i.id !== productId);
      persist(next);
      return next;
    });
  }, [persist]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.some(i => i.id === productId);
  }, [wishlistItems]);

  const value: WishlistContextType = {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    wishlistCount: wishlistItems.length,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
