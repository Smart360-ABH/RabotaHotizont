

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, User, VendorPublicProfile, Review, OrderDetails, OrderStatus, VendorProfile, Appeal } from '../types';
import { api } from '../services/api';
import * as back4app from '../services/back4appRest';
import { MOCK_VENDORS, MOCK_REVIEWS } from '../constants';
import { useUser } from './UserContext';
interface MarketContextType {
  products: Product[];
  isLoading: boolean;
  cart: CartItem[];
  user: User | null;
  favorites: string[];
  followedVendors: string[];
  reviews: Review[];
  orders: OrderDetails[];
  vendors: VendorPublicProfile[];
  users: User[];

  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  toggleFollowVendor: (vendorId: string) => void;

  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;

  addReview: (review: Omit<Review, 'id' | 'date'>) => void;
  deleteReview: (reviewId: string) => void;
  appeals: Appeal[];
  appealReview: (reviewId: string, reason: string) => boolean;
  getAppealsForProduct: (productId: string) => Appeal[];
  resolveAppeal: (appealId: string, action: 'accept' | 'reject', decision?: string) => boolean;
  auditLogs: Array<{ id: string; action: string; by?: string; at: string; meta?: any }>;
  logAudit: (action: string, meta?: any) => void;

  getVendorById: (id: string) => VendorPublicProfile | undefined;
  registerVendor: (data: VendorProfile & { name: string }) => void;
  updateVendorStatus: (vendorId: string, status: 'active' | 'blocked') => void;

  addOrder: (order: OrderDetails) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  login: (role: 'user' | 'admin' | 'vendor') => void;
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
  const { user, updateUser } = useUser();
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; action: string; by?: string; at: string; meta?: any }>>([]);
  const [vendors, setVendors] = useState<VendorPublicProfile[]>([]);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [users, setUsers] = useState<User[]>([
    { id: 'u1', name: 'Иван Иванов', email: 'user@store.com', role: 'user' },
    { id: 'u_test', name: 'John Doe', email: 'john@example.com', role: 'user' },
    { id: 'v1', name: 'Vendor Tech', email: 'vendor@store.com', role: 'vendor', vendorId: 'v_tech' },
    { id: 'a1', name: 'Admin', email: 'admin@store.com', role: 'admin' }
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 1. Load Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load from Back4App REST API
        const data = await back4app.getProducts(1000);
        // back4app.getProducts may return either an array or a Parse-style { results: [...] }
        let results: any[] = [];
        if (Array.isArray(data)) results = data;
        else if (data && Array.isArray((data as any).results)) results = (data as any).results;

        if (results.length > 0) {
          const mappedProducts = results.map((p: any) => ({
            id: p.objectId,
            title: p.title,
            author: p.vendorName || p.author,
            category: p.category || 'Electronics',
            price: p.price || 0,
            image: p.image && (typeof p.image === 'string' ? p.image : p.image.url || p.image.__type === 'File' && p.image.name ? p.image.url : p.image),
            description: p.description,
            vendorId: p.vendorId, // Explicitly map vendorId
            tags: p.tags || [],
            reviewsCount: 0,
            rating: 4.5,
            isNew: false,
            isFavorite: false,
            status: p.status || 'active'
          }));
          setProducts(mappedProducts);
        } else {
          setProducts([]);
        }

        // Load reviews: first try server, then localStorage, then MOCK
        try {
          const serverReviews = await back4app.getReviews();
          let reviewResults: any[] = [];
          if (Array.isArray(serverReviews)) reviewResults = serverReviews;
          else if (serverReviews && Array.isArray((serverReviews as any).results)) reviewResults = (serverReviews as any).results;

          if (reviewResults.length > 0) {
            const mapped = reviewResults.map((r: any) => ({
              id: r.objectId || r.id || Date.now().toString(),
              productId: r.productId,
              userId: r.userId,
              userName: r.userName,
              rating: r.rating,
              comment: r.comment,
              date: r.date || new Date().toLocaleDateString('ru-RU')
            }));
            setReviews(mapped);
            // Cache to localStorage
            localStorage.setItem('market_reviews', JSON.stringify(mapped));
          } else {
            // No reviews on server, try localStorage
            const saved = localStorage.getItem('market_reviews');
            if (saved) {
              setReviews(JSON.parse(saved));
            } else {
              setReviews(MOCK_REVIEWS);
            }
          }
        } catch (err) {
          console.warn('Failed to load reviews from server, trying localStorage:', err);
          // Fallback to localStorage
          const saved = localStorage.getItem('market_reviews');
          if (saved) {
            try {
              setReviews(JSON.parse(saved));
            } catch (e) {
              console.warn('Failed to load saved reviews, using mock:', e);
              setReviews(MOCK_REVIEWS);
            }
          } else {
            setReviews(MOCK_REVIEWS);
          }
        }

        // Load appeals from localStorage
        const savedAppeals = localStorage.getItem('market_appeals');
        if (savedAppeals) {
          try {
            setAppeals(JSON.parse(savedAppeals));
          } catch (e) {
            console.warn('Failed to load saved appeals:', e);
            setAppeals([]);
          }
        }
        // Load audit logs
        const savedAudit = localStorage.getItem('market_audit_logs');
        if (savedAudit) {
          try {
            setAuditLogs(JSON.parse(savedAudit));
          } catch (e) {
            console.warn('Failed to load saved audit logs:', e);
            setAuditLogs([]);
          }
        }

        // Load vendors (users with role='vendor')
        try {
          const vendorUsers = await back4app.getUsersByRole('vendor');
          let vResults: any[] = [];
          if (Array.isArray(vendorUsers)) vResults = vendorUsers;
          else if (vendorUsers && Array.isArray((vendorUsers as any).results)) vResults = (vendorUsers as any).results;

          const realVendors = vResults.map((u: any) => {
            // Handle both Parse object and plain JSON responses
            const objectId = u.id || u.objectId;
            const username = typeof u.get === 'function' ? u.get('username') : u.username;
            const companyName = typeof u.get === 'function' ? u.get('companyName') : u.companyName;
            const description = typeof u.get === 'function' ? u.get('description') : u.description;
            const avatar = typeof u.get === 'function' ? u.get('avatar') : u.avatar;
            const coverImage = typeof u.get === 'function' ? u.get('coverImage') : u.coverImage;

            return {
              id: objectId,
              name: companyName || username || 'Unknown Vendor',
              description: description || `Магазин ${username}`,
              image: avatar?.url || 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=200&q=80',
              rating: 5.0,
              joinedDate: u.createdAt,
              status: 'active',
              vendorId: objectId,
              revenue: 0,
              coverImage: coverImage?.url
            };
          });

          console.log(`[MarketContext] Loaded ${realVendors.length} real vendors + ${MOCK_VENDORS.length} mock vendors`);
          console.log('[MarketContext] Real vendors:', realVendors.map(v => ({ id: v.id, name: v.name })));
          console.log('[MarketContext] Mock vendors:', MOCK_VENDORS.map(v => ({ id: v.id, name: v.name })));

          const allVendors = [...MOCK_VENDORS, ...realVendors];
          setVendors(allVendors);

          console.log('[MarketContext] Total vendors in state:', allVendors.length);
          console.log('[MarketContext] Vendor IDs:', allVendors.map(v => v.id));
        } catch (err) {
          console.warn('Failed to load vendors', err);
          setVendors(MOCK_VENDORS);
        }
      } catch (e) {
        console.error("Failed to load products", e);
        setProducts([]);
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
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Persist reviews to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('market_reviews', JSON.stringify(reviews));
  }, [reviews]);

  // Persist appeals to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('market_appeals', JSON.stringify(appeals));
  }, [appeals]);

  // Persist audit logs
  useEffect(() => {
    localStorage.setItem('market_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

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

  // --- VENDOR FOLLOWING ---
  const [followedVendors, setFollowedVendors] = useState<string[]>([]);

  useEffect(() => {
    const savedFollows = localStorage.getItem('market_followed_vendors');
    if (savedFollows) setFollowedVendors(JSON.parse(savedFollows));
  }, []);

  useEffect(() => {
    localStorage.setItem('market_followed_vendors', JSON.stringify(followedVendors));
  }, [followedVendors]);

  const toggleFollowVendor = (vendorId: string) => {
    setFollowedVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
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
  // Add review - ensure only one review per user per product
  const addReview = (reviewData: Omit<Review, 'id' | 'date'>): boolean => {
    const exists = reviews.some(r => r.productId === reviewData.productId && r.userId === reviewData.userId);
    if (exists) {
      console.warn('[addReview] User already left a review for this product', reviewData.userId, reviewData.productId);
      return false;
    }

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

    // Try to save to server (best-effort, non-blocking)
    // Don't send 'id' field to Parse — it will reject it as invalid field name
    (async () => {
      try {
        if (back4app && (back4app as any).createReview) {
          const serverPayload = {
            productId: newReview.productId,
            userId: newReview.userId,
            userName: newReview.userName,
            rating: newReview.rating,
            comment: newReview.comment,
            date: newReview.date
          };
          await (back4app as any).createReview(serverPayload);
          console.info('[addReview] Review saved to server');
        }
      } catch (err) {
        console.warn('[addReview] Failed to save review to server (continuing with local):', err);
      }
    })();

    return true;
  };

  const deleteReview = (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));

    // Try to delete from server (best-effort)
    (async () => {
      try {
        if (back4app && (back4app as any).deleteReview) {
          await (back4app as any).deleteReview(reviewId);
          console.info('[deleteReview] Review deleted from server');
        }
      } catch (err) {
        console.warn('[deleteReview] Failed to delete review from server:', err);
      }
    })();
  };

  // Appeals: users can appeal/report a review for moderation
  const appealReview = (reviewId: string, reason: string): boolean => {
    if (!user) {
      console.warn('[appealReview] No user logged in');
      return false;
    }
    const review = reviews.find(r => r.id === reviewId);
    if (!review) {
      console.warn('[appealReview] Review not found', reviewId);
      return false;
    }
    const newAppeal: Appeal = {
      id: Date.now().toString(),
      reviewId,
      productId: review.productId,
      reporterId: user.id,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setAppeals(prev => [newAppeal, ...prev]);
    // Try to persist to server; non-blocking (best-effort)
    (async () => {
      try {
        if (back4app && (back4app as any).createAppeal) {
          await (back4app as any).createAppeal(newAppeal);
        }
      } catch (err) {
        console.warn('Failed to persist appeal to server (continuing with local only):', err);
      }
    })();
    return true;
  };

  const getAppealsForProduct = (productId: string) => {
    return appeals.filter(a => a.productId === productId);
  };

  // Admin action: resolve appeal. If accepted, we can remove the review.
  const resolveAppeal = (appealId: string, action: 'accept' | 'reject', decision?: string) => {
    const appeal = appeals.find(a => a.id === appealId);
    if (!appeal) return false;
    const resolvedAt = new Date().toISOString();
    setAppeals(prev => prev.map(a => a.id === appealId ? { ...a, status: action === 'accept' ? 'accepted' : 'rejected', decision, resolvedAt } : a));
    if (action === 'accept') {
      // remove the review that was appealed
      setReviews(prev => prev.filter(r => r.id !== appeal.reviewId));
      // update product stats (best-effort)
      setProducts(prev => prev.map(p => {
        if (p.id === appeal.productId) {
          const related = reviews.filter(r => r.productId === p.id && r.id !== appeal.reviewId);
          const newCount = related.length;
          const avg = newCount > 0 ? Number((related.reduce((s, rr) => s + rr.rating, 0) / newCount).toFixed(1)) : 0;
          return { ...p, reviewsCount: newCount, rating: newCount ? avg : p.rating };
        }
        return p;
      }));
    }

    // Audit log the action
    try {
      const actor = user ? user.id : 'anonymous';
      const entry = { id: Date.now().toString(), action: `appeal_${action}`, by: actor, at: resolvedAt, meta: { appealId, decision } };
      setAuditLogs(prev => [entry, ...prev]);
      // Try to persist appeal resolution to server (best-effort)
      (async () => {
        try {
          if (back4app && (back4app as any).updateAppeal) {
            await (back4app as any).updateAppeal(appealId, { status: action === 'accept' ? 'accepted' : 'rejected', decision, resolvedAt });
          }
        } catch (err) {
          console.warn('Failed to persist appeal resolution to server:', err);
        }
      })();
    } catch (err) {
      console.warn('Failed to write audit log:', err);
    }
    return true;
  };

  // --- VENDORS ---
  const getVendorById = (id: string) => {
    const found = vendors.find(v => v.id === id);
    if (!found) {
      console.warn(`[getVendorById] Vendor not found for ID: ${id}. Available IDs:`, vendors.map(v => v.id));
    }
    return found;
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
      updateUser({ role: 'vendor' as const, vendorId: newVendorId });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: 'vendor' as const, vendorId: newVendorId } : u));
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
    // In a unified context, Login page calls useUser().login.
    // This market.login is now a legacy placeholder or can be used for mock role switching if needed.
    console.log('[MarketContext] Legacy login called for role:', role);
  };

  const logout = () => {
    console.log('[MarketContext] Legacy logout called');
  };

  const updateUserRole = (userId: string, role: 'user' | 'admin' | 'vendor') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  };

  const blockUser = (userId: string, isBlocked: boolean) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked } : u));
  };

  // --- AUDIT helper exposed to UI/components ---
  const logAudit = (action: string, meta?: any) => {
    try {
      const entry = { id: Date.now().toString(), action, by: user ? user.id : 'anonymous', at: new Date().toISOString(), meta };
      setAuditLogs(prev => [entry, ...prev]);
      // Best-effort: if server supports audit persistence, call it here (not implemented server-side yet)
    } catch (err) {
      console.warn('logAudit failed', err);
    }
  };

  return (
    <MarketContext.Provider
      value={{
        products, isLoading, cart, user, favorites, reviews, orders, vendors, users,
        addToCart, removeFromCart, updateQuantity, clearCart, toggleFavorite,
        followedVendors, toggleFollowVendor,
        addProduct, updateProduct,
        addReview, deleteReview,
        appeals, appealReview, getAppealsForProduct, resolveAppeal,
        getVendorById, registerVendor, updateVendorStatus,
        addOrder, updateOrderStatus,
        login, logout, updateUserRole, blockUser,
        auditLogs, logAudit,
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
