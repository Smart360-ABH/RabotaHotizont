
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User as UserIcon, Search, Menu, X, Monitor, LogOut, Grid, Home, List } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useUser } from '../context/UserContext';
import { AIAssistant } from './AIAssistant';
import { Facebook, Twitter, Instagram, Chrome } from 'lucide-react';
import * as back4app from '../services/back4appRest';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cart, searchQuery, setSearchQuery, isDarkMode, toggleTheme } = useMarket();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Profile Dropdown State with Delay
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const timeoutRef = useRef<any>(null);

  const handleProfileEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsProfileOpen(true);
  };

  const handleProfileLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsProfileOpen(false);
    }, 1000); // 1 second delay
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/catalog');
  };

  // Helper to check active route for bottom nav
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* --- DESKTOP TOP HEADER --- */}
      {/* Sticky top header, hidden on mobile for the bottom nav approach, OR kept as a search bar area on mobile */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#6b21a8] to-[#4c1d95] shadow-lg transition-colors duration-300 text-white">
        
        {/* Top Info Bar (Desktop Only) */}
        <div className="bg-[#1f1f1f] text-white text-xs py-1 px-4 hidden md:block border-b border-white/10">
            <div className="container mx-auto flex justify-between items-center">
                 <div className="flex items-center gap-4">
                     <span className="hover:text-indigo-300 cursor-pointer transition">Сухум</span>
                     <span className="text-gray-500">|</span>
                     <Link to="/become-seller" className="hover:text-indigo-300 transition">Продавайте на Горизонте</Link>
                 </div>
                 <div className="flex items-center gap-4">
                     <button onClick={toggleTheme} className="hover:text-indigo-300 flex items-center gap-1">
                        <Monitor className="w-3 h-3" /> {isDarkMode ? 'Светлая тема' : 'Темная тема'}
                     </button>
                 </div>
            </div>
        </div>

        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 md:gap-6">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0 group">
              <div className="relative">
                 <img 
                    src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=100&q=80" 
                    alt="Горизонт Logo" 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover shadow-md border-2 border-white/20 group-hover:scale-110 transition-transform"
                 />
                 <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse"></div>
              </div>
              <span className="font-logo text-lg md:text-2xl tracking-wide hidden md:block drop-shadow-md">Горизонт</span>
            </Link>

            {/* Desktop Catalog Button */}
            <Link 
                to="/categories" 
                className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition border border-white/10 shrink-0"
            >
                {isProfileOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5" />}
                <span className="font-bold">Каталог</span>
            </Link>

            {/* Search Bar (Responsive) */}
            <form onSubmit={handleSearch} className="flex-1 max-w-3xl relative">
              <input
                type="text"
                placeholder="Искать на Горизонте..."
                className="w-full pl-4 pr-10 py-2 md:py-2.5 bg-white/10 border-2 border-transparent focus:border-white/30 text-white placeholder-white/60 rounded-xl md:rounded-full focus:outline-none focus:bg-white/20 transition backdrop-blur-sm text-sm md:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-1 top-1 bottom-1 px-2 md:px-3 bg-transparent hover:bg-white/10 rounded-full transition text-white">
                  <Search className="w-5 h-5" />
              </button>
            </form>

            {/* Desktop Actions (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-6">
              
              {/* Login / Profile */}
              {user ? (
                <div 
                  className="relative group"
                  onMouseEnter={handleProfileEnter}
                  onMouseLeave={handleProfileLeave}
                >
                    <Link to="/profile" className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition">
                        <UserIcon className="w-6 h-6" />
                        <span className="text-[10px] max-w-[60px] truncate">{user.name || user.username}</span>
                    </Link>
                    
                    {/* Dropdown */}
                    <div className={`absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl py-2 ${isProfileOpen ? 'block' : 'hidden'} border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-200 z-50 animate-fade-in-up`}>
                        <div className="px-4 py-3 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                            <p className="font-bold text-sm truncate">{user.name || user.username}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <div className="py-1">
                            {user.role === 'admin' && (
                                <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"><Monitor size={14}/> Админ-панель</Link>
                            )}
                            {user.role === 'vendor' && (
                                <Link to="/vendor" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"><Grid size={14}/> Панель продавца</Link>
                            )}
                            <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"><UserIcon size={14}/> Профиль</Link>
                            <Link to="/favorites" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"><Heart size={14}/> Избранное</Link>
                        </div>
                        <div className="border-t dark:border-slate-700 mt-1 pt-1">
                             <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2">
                                <LogOut className="w-4 h-4"/> Выйти
                            </button>
                        </div>
                    </div>
                </div>
              ) : (
                <Link to="/login" className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition">
                    <UserIcon className="w-6 h-6" />
                    <span className="text-[10px]">Войти</span>
                </Link>
              )}

              <Link to="/favorites" className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition group">
                 <Heart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                 <span className="text-[10px]">Избранное</span>
              </Link>

              <Link to="/cart" className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition group relative">
                 <div className="relative">
                     <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                     {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-[#4c1d95]">
                            {cartCount}
                        </span>
                     )}
                 </div>
                 <span className="text-[10px]">Корзина</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Back4App initialization warning banner */}
      {!back4app.isInitialized() && (
        <div className="w-full bg-yellow-50 border-t border-b border-yellow-200 text-yellow-900 py-2 text-center text-sm">
          Back4App не инициализирован. Часто это означает, что переменные окружения не заданы во время сборки/развертывания.
          Проверьте VITE_PARSE_APP_ID и VITE_PARSE_REST_KEY на хостинге и перезапустите сервис.
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      {/* Added padding-bottom on mobile to prevent content from being hidden behind the bottom nav */}
      <main className="flex-1 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 pb-[70px] md:pb-0">
        {children}
      </main>

      {/* --- FOOTER (Hidden on mobile if it interferes, but usually fine) --- */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-auto border-t border-slate-800 hidden md:block">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                <h3 className="text-white font-logo text-xl mb-4">Горизонт</h3>
                <p className="text-sm">Ведущий маркетплейс Абхазии.</p>
            </div>
            <div>
                <h4 className="text-white font-semibold mb-4">Покупателям</h4>
                <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-white">Как сделать заказ</a></li>
                    <li><a href="#" className="hover:text-white">Доставка</a></li>
                </ul>
            </div>
            <div>
                <h4 className="text-white font-semibold mb-4">Партнерам</h4>
                <ul className="space-y-2 text-sm">
                    <li><Link to="/become-seller" className="hover:text-white">Стать продавцом</Link></li>
                    <li><Link to="/login" className="hover:text-white">Вход для продавцов</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="text-white font-semibold mb-4">Контакты</h4>
                <p className="text-sm">+79409435555</p>
                
                <div className="mt-6">
                  <style>{`
                    .social-list { display: flex; gap: 10px; padding: 0; list-style: none; }
                    .social-list li a {
                      width: 40px; height: 40px; background: #fff; display: flex;
                      justify-content: center; align-items: center; border-radius: 50%;
                      transition: 0.3s; color: #333;
                    }
                    .social-list li a:hover { transform: translateY(-3px); }
                  `}</style>
                  <ul className="social-list">
                    <li><a href="#"><Facebook className="w-5 h-5"/></a></li>
                    <li><a href="#"><Instagram className="w-5 h-5"/></a></li>
                  </ul>
                </div>
            </div>
        </div>
      </footer>

      {/* --- MOBILE BOTTOM NAVIGATION BAR --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1e1e1e] border-t dark:border-slate-700 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-50 px-2 pb-safe">
        <nav className="flex justify-between items-center h-[60px]">
            
            <Link to="/" className={`flex-1 flex flex-col items-center justify-center gap-1 h-full ${isActive('/') ? 'text-[#6d28d9]' : 'text-gray-400 dark:text-gray-500'}`}>
                <Home className={`w-6 h-6 ${isActive('/') ? 'fill-current' : ''}`} strokeWidth={isActive('/') ? 0 : 2} />
                <span className="text-[10px] font-medium">Главная</span>
            </Link>

            <Link to="/categories" className={`flex-1 flex flex-col items-center justify-center gap-1 h-full ${isActive('/categories') || isActive('/catalog') ? 'text-[#6d28d9]' : 'text-gray-400 dark:text-gray-500'}`}>
                <Search className="w-6 h-6" strokeWidth={2.5} />
                <span className="text-[10px] font-medium">Каталог</span>
            </Link>

            <Link to="/cart" className={`flex-1 flex flex-col items-center justify-center gap-1 h-full relative ${isActive('/cart') ? 'text-[#6d28d9]' : 'text-gray-400 dark:text-gray-500'}`}>
                <div className="relative">
                    <ShoppingCart className={`w-6 h-6 ${isActive('/cart') ? 'fill-current' : ''}`} strokeWidth={isActive('/cart') ? 0 : 2} />
                    {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-[#1e1e1e]">
                            {cartCount}
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-medium">Корзина</span>
            </Link>

            <Link to="/favorites" className={`flex-1 flex flex-col items-center justify-center gap-1 h-full ${isActive('/favorites') ? 'text-[#6d28d9]' : 'text-gray-400 dark:text-gray-500'}`}>
                <Heart className={`w-6 h-6 ${isActive('/favorites') ? 'fill-current' : ''}`} strokeWidth={isActive('/favorites') ? 0 : 2} />
                <span className="text-[10px] font-medium">Избранное</span>
            </Link>

            <Link to={user ? "/profile" : "/login"} className={`flex-1 flex flex-col items-center justify-center gap-1 h-full ${isActive('/profile') || isActive('/login') ? 'text-[#6d28d9]' : 'text-gray-400 dark:text-gray-500'}`}>
                <UserIcon className={`w-6 h-6 ${isActive('/profile') || isActive('/login') ? 'fill-current' : ''}`} strokeWidth={isActive('/profile') || isActive('/login') ? 0 : 2} />
                <span className="text-[10px] font-medium">Профиль</span>
            </Link>

        </nav>
      </div>

      <AIAssistant />
    </div>
  );
};