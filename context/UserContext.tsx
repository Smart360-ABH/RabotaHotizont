import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  objectId: string;
  username: string;
  name?: string;
  email: string;
  role: 'customer' | 'vendor' | 'admin';
  sessionToken?: string;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('market_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load user from localStorage:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for session expiration events (dispatched by services/back4app)
  useEffect(() => {
    const handleSessionExpired = () => {
      console.info('[UserContext] Session expired, clearing user state');
      setUser(null);
      // localStorage should already be cleared by restoreSession/notifySessionExpired
      // but double-check to be safe
      localStorage.removeItem('market_user');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('sessionExpired', handleSessionExpired as EventListener);
      return () => window.removeEventListener('sessionExpired', handleSessionExpired as EventListener);
    }
  }, []);

  const login = (newUser: User) => {
    // If it's a mock user or we are doing a fresh login, clear any existing Parse session
    // to prevent sessionToken bleed-over in proxyApiRequest
    try {
      if (typeof window !== 'undefined') {
        import('parse').then(({ default: Parse }) => {
          Parse.User.logOut().catch(() => { });
        });
      }
    } catch { }

    setUser(newUser);
    localStorage.setItem('market_user', JSON.stringify(newUser));
  };

  const logout = () => {
    try {
      if (typeof window !== 'undefined') {
        import('parse').then(({ default: Parse }) => {
          Parse.User.logOut().catch(() => { });
        });
      }
    } catch { }
    setUser(null);
    localStorage.removeItem('market_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      localStorage.setItem('market_user', JSON.stringify(updated));
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
