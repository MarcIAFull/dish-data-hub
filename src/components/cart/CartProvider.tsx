import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: { id: string; name: string; price: number }, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
  restaurantId: string;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children, restaurantId }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${restaurantId}`);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, [restaurantId]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(items));
  }, [items, restaurantId]);

  const addItem = (product: { id: string; name: string; price: number }, quantity = 1) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity, notes: '' }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const updateNotes = (productId: string, notes: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, notes } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isCartOpen,
    setIsCartOpen,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};