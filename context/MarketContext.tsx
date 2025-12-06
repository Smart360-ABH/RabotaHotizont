

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, User, VendorPublicProfile, Review, OrderDetails, OrderStatus, VendorProfile } from '../types';
import { api } from '../services/api';
import { Back4App, isBack4AppConfigured } from '../services/back4app';
import { MOCK_VENDORS, MOCK_REVIEWS } from '../constants';

interface MarketContextType {
  products: Product[];
  isLoading: boolean;
  cart: CartItem[];
  user: User | null;
  favorites: string[];
  reviews: Review[];
  orders: OrderDetails[];
  vendors: VendorPublicProfile[];
  users: User[];
  
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  
  addReview: (review: Omit<Review, 'id' | 'date'>) => void;
  deleteReview: (reviewId: string) => void;
  
  getVendorById: (id: string) => VendorPublicProfile | undefined;
  registerVendor: (data: VendorProfile & { name: string }) => void;
  updateVendorStatus: (vendorId: string, status: 'active' | 'blocked') => void;

  addOrder: (order: OrderDetails) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  
  login: (role: 'user' | 'admin' | 'vendor') => void;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserRole: (userId: string, role: 'user' | 'admin' | 'vendor') => void;
  blockUser: (userId: string, isBlocked: boolean) => void;
  
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [vendors, setVendors] = useState<VendorPublicProfile[]>([]);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [users, setUsers] = useState<User[]>([
      { id: 'u1', name: 'Иван Иванов', email: 'user@store.com', role: 'user' },
      { id: 'v1', name: 'Vendor Tech', email: 'vendor@store.com', role: 'vendor', vendorId: 'v_tech' },
      { id: 'a1', name: 'Admin', email: 'admin@store.com', role: 'admin' }
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 1. Load Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await api.getProducts();
        setProducts(data);
        setReviews(MOCK_REVIEWS);
        setVendors(MOCK_VENDORS);
      } catch (e) {
        console.error("Failed to load products", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    const savedCart = localStorage.getItem('cart');
    if (savedCart) setCart(JSON.parse(savedCart));

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
    } else {
        const hour = new Date().getHours();
        if (hour >= 21 || hour < 6) setIsDarkMode(true);
    }

    // Restore Parse session if Back4App is configured
    if (isBack4AppConfigured) {
      const currentUser = Back4App.getCurrentUserJson();
      if (currentUser) {
        const appUser: User = {
          id: currentUser.objectId,
          name: currentUser.name,
          email: currentUser.email,
          role: (currentUser.role || 'user') as 'user' | 'admin' | 'vendor',
          vendorId: currentUser.vendorId,
        };
        setUser(appUser);
        localStorage.setItem('user', JSON.stringify(appUser));
      } else {
        // Try to restore from localStorage as fallback
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser));
      }
    } else {
      // Fallback to localStorage in non-Back4App mode
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // --- CART ---
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };
  
  const clearCart = () => setCart([]);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // --- PRODUCTS ---
  const addProduct = (product: Product) => {
    const productWithVendor = {
        ...product,
        vendorId: user?.role === 'vendor' ? user.vendorId : product.vendorId
    };
    setProducts((prev) => [productWithVendor, ...prev]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts((prev) => 
      prev.map((p) => p.id === updatedProduct.id ? updatedProduct : p)
    );
  };

  // --- REVIEWS ---
  const addReview = (reviewData: Omit<Review, 'id' | 'date'>) => {
      const newReview: Review = {
          ...reviewData,
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('ru-RU')
      };
      setReviews(prev => [newReview, ...prev]);
      
      // Update product stats
      setProducts(prev => prev.map(p => {
          if (p.id === reviewData.productId) {
              const newCount = p.reviewsCount + 1;
              const currentTotal = p.rating * p.reviewsCount;
              const newRating = (currentTotal + reviewData.rating) / newCount;
              return { ...p, reviewsCount: newCount, rating: Number(newRating.toFixed(1)) };
          }
          return p;
      }));
  };
  
  const deleteReview = (reviewId: string) => {
      setReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  // --- VENDORS ---
  const getVendorById = (id: string) => {
      return vendors.find(v => v.id === id);
  };

  const registerVendor = (data: VendorProfile & { name: string }) => {
      const newVendorId = `v_${Date.now()}`;
      const newVendor: VendorPublicProfile = {
          id: newVendorId,
          name: data.companyName,
          description: `Магазин ${data.companyName}`,
          image: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=200&q=80',
          rating: 0,
          joinedDate: new Date().toISOString().split('T')[0],
          status: 'pending',
          vendorId: newVendorId,
          revenue: 0
      };
      setVendors(prev => [...prev, newVendor]);
      
      // Update the user who registered
      if (user) {
          const updatedUser = { ...user, role: 'vendor' as const, vendorId: newVendorId };
          setUser(updatedUser);
          setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      }
  };

  const updateVendorStatus = (vendorId: string, status: 'active' | 'blocked') => {
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, status } : v));
  };

  // --- ORDERS ---
  const addOrder = (order: OrderDetails) => {
      setOrders(prev => [order, ...prev]);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // --- USERS ---
  const login = async (role: 'user' | 'admin' | 'vendor') => {
    // In a real app, this would fetch from API. Here we just find/create mock
    const mockUser = users.find(u => u.role === role);
    if (mockUser) {
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    }
    else {
        // Fallback for demo if mock user deleted
        const demoUser: User = { id: 'u_demo', name: 'Demo User', email: 'user@store.com', role };
        setUser(demoUser);
        localStorage.setItem('user', JSON.stringify(demoUser));
    }
  };

  /**
   * Вход с email и паролем через Back4App (или fallback в мок-режиме)
   */
  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
      if (isBack4AppConfigured) {
        // Используем Back4App для реальной аутентификации
        const back4appUser = await Back4App.login(email, password);
        if (back4appUser) {
          const appUser: User = {
            id: back4appUser.objectId,
            name: back4appUser.name,
            email: back4appUser.email,
            role: (back4appUser.role || 'user') as 'user' | 'admin' | 'vendor',
            vendorId: back4appUser.vendorId,
          };
          setUser(appUser);
          localStorage.setItem('user', JSON.stringify(appUser));
          return true;
        }
        return false;
      } else {
        // Мок-режим: проверяем email и устанавливаем роль
        console.log('[Auth] Using mock mode for:', email);
        let role: 'user' | 'admin' | 'vendor' = 'user';
        if (email.includes('admin')) role = 'admin';
        if (email.includes('vendor')) role = 'vendor';

        const mockUser: User = {
          id: `u_${Date.now()}`,
          name: email.split('@')[0],
          email,
          role,
        };
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return true;
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    if (isBack4AppConfigured) {
      await Back4App.logout();
    }
    setUser(null);
    localStorage.removeItem('user');
    setCart([]);
  };

  const updateUserRole = (userId: string, role: 'user' | 'admin' | 'vendor') => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  };

  const blockUser = (userId: string, isBlocked: boolean) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked } : u));
  };

  return (
    <MarketContext.Provider
      value={{
        products, isLoading, cart, user, favorites, reviews, orders, vendors, users,
        addToCart, removeFromCart, updateQuantity, clearCart, toggleFavorite,
        addProduct, updateProduct,
        addReview, deleteReview,
        getVendorById, registerVendor, updateVendorStatus,
        addOrder, updateOrderStatus,
        login, loginWithCredentials, logout, updateUserRole, blockUser,
        searchQuery, setSearchQuery, isDarkMode, toggleTheme
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (!context) throw new Error('useMarket must be used within a MarketProvider');
  return context;
};
