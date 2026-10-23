'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface CartItem {
  cartItemId: string; // unique key: `${productId}__${tierKey}`
  productId: string;
  title: string;
  imageUrl?: string;
  categoryLabel?: string;
  tierKey: string;
  tierName: string;
  dailyLimit?: number;
  pricePHP: number;
  priceUSD: number;
  originalPricePHP?: number;
  originalPriceUSD?: number;
  discountPercent?: number;
  hasDiscount?: boolean;
  quantity: number;
  deliveryMode?: 'automated_license' | 'stock_pool';
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'cartItemId'>, quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalCount: number;
  totalPHP: number;
  totalUSD: number;
  isHydrated: boolean;
}

const CART_STORAGE_KEY = 'async_cart_v1';
const CART_EVENT_NAME = 'async-cart-change';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage once mounted
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn('[Cart] Failed to load local cart storage:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save changes to localStorage & dispatch custom sync event
  const persistItems = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
      window.dispatchEvent(new Event(CART_EVENT_NAME));
    } catch (e) {
      console.warn('[Cart] Failed to save cart to localStorage:', e);
    }
  }, []);

  // Sync across tabs & windows
  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        } else {
          setItems([]);
        }
      } catch (e) {
        console.warn('[Cart] Sync event parsing error:', e);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener(CART_EVENT_NAME, handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener(CART_EVENT_NAME, handleSync);
    };
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity' | 'cartItemId'>, quantity = 1) => {
      const safeQty = Math.max(1, quantity);
      const cartItemId = `${item.productId}__${item.tierKey}`;

      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId);
        let updated: CartItem[];

        if (existingIndex > -1) {
          updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + safeQty,
            pricePHP: item.pricePHP,
            priceUSD: item.priceUSD
          };
        } else {
          updated = [
            ...prev,
            {
              ...item,
              cartItemId,
              quantity: safeQty
            }
          ];
        }

        try {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event(CART_EVENT_NAME));
        } catch (e) {
          console.warn('[Cart] Storage save warning:', e);
        }

        return updated;
      });
    },
    []
  );

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.cartItemId !== cartItemId);
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event(CART_EVENT_NAME));
      } catch (e) {
        console.warn('[Cart] Remove item storage warning:', e);
      }
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setItems((prev) => {
        const updated = prev.filter((i) => i.cartItemId !== cartItemId);
        try {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event(CART_EVENT_NAME));
        } catch (e) {
          console.warn('[Cart] Update qty remove warning:', e);
        }
        return updated;
      });
      return;
    }

    setItems((prev) => {
      const updated = prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
      );
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event(CART_EVENT_NAME));
      } catch (e) {
        console.warn('[Cart] Update qty storage warning:', e);
      }
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    persistItems([]);
  }, [persistItems]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const totalCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const totalPHP = useMemo(() => {
    return items.reduce((acc, item) => acc + item.pricePHP * item.quantity, 0);
  }, [items]);

  const totalUSD = useMemo(() => {
    return items.reduce((acc, item) => acc + item.priceUSD * item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        totalCount,
        totalPHP,
        totalUSD,
        isHydrated
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
