/**
 * Дашборд Вендора (Личный кабинет продавца)
 * Полный адаптивный интерфейс с навигацией и управлением контентом
 * Интеграция с Parse/Back4App для всех операций
 */

import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  LogOut,
  Menu,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import * as parseSDK from '../services/parseSDK';
import VendorProducts from './VendorProducts';
import VendorOrders from './VendorOrders';
import VendorFinance from './VendorFinance';
import VendorSettings from './VendorSettings';

type TabType = 'dashboard' | 'products' | 'orders' | 'finance' | 'settings';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalIncome: number;
  pendingOrders: number;
}

const VendorDashboard: React.FC = () => {
  const { user, logout } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalIncome: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Проверка прав доступа
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'vendor') return <Navigate to="/home" replace />;

  // Загрузка статистики при первой загрузке
  useEffect(() => {
    loadDashboardStats();
  }, [user?.objectId]);

  const loadDashboardStats = async () => {
    if (!user?.objectId) return;

    try {
      setLoading(true);
      setError(null);

      // Загружаем товары вендора
      const products = await parseSDK.getProductsByVendor(user.objectId);
      
      // Загружаем заказы и статистику
      const orders = await parseSDK.getOrdersByVendor(user.objectId);
      const orderStats = await parseSDK.getOrderStats(user.objectId);
      
      // Загружаем финансовый отчет
      const financialReport = await parseSDK.getFinancialReport(user.objectId);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalIncome: financialReport.netIncome,
        pendingOrders: orderStats.pending,
      });
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
      setError('Не удалось загрузить данные. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await parseSDK.logoutUser();
      logout();
    } catch (err) {
      console.error('Ошибка выхода:', err);
    }
  };

  // Боковая панель навигации
  const SidebarNav = () => (
    <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-800 transition-transform z-30 ${!sidebarOpen ? '-translate-x-full md:translate-x-0' : ''}`}>
      <div className="p-6 flex flex-col h-full">
        {/* Заголовок */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {user?.username}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Панель продавца</p>
        </div>

        {/* Меню навигации */}
        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard' as TabType, label: 'Дашборд', icon: LayoutDashboard },
            { id: 'products' as TabType, label: 'Товары', icon: ShoppingBag },
            { id: 'orders' as TabType, label: 'Заказы', icon: ShoppingCart },
            { id: 'finance' as TabType, label: 'Финансы', icon: DollarSign },
            { id: 'settings' as TabType, label: 'Настройки', icon: Package },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* Кнопка выхода */}
        <div className="border-t dark:border-slate-800 pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Выйти</span>
          </button>
        </div>
      </div>
    </aside>
  );

  // Статистические карточки
  const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({
    label,
    value,
    icon,
    color,
  }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-lg p-6 border-l-4 ${color} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`${color.replace('border-', 'text-')} opacity-20`}>{icon}</div>
      </div>
    </div>
  );

  // Контент дашборда
  const DashboardContent = () => (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Добро пожаловать, {user?.username}!</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Здесь вы можете управлять своим магазином</p>
      </div>

      {/* Ошибка загрузки */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">Ошибка загрузки</h3>
            <p className="text-red-800 dark:text-red-200 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Статистика */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-slate-700 rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Всего товаров"
            value={stats.totalProducts}
            icon={<ShoppingBag size={32} />}
            color="border-blue-500"
          />
          <StatCard
            label="Всего заказов"
            value={stats.totalOrders}
            icon={<ShoppingCart size={32} />}
            color="border-green-500"
          />
          <StatCard
            label="Чистый доход"
            value={parseSDK.formatCurrency(stats.totalIncome)}
            icon={<DollarSign size={32} />}
            color="border-purple-500"
          />
          <StatCard
            label="Ожидающие заказы"
            value={stats.pendingOrders}
            icon={<Clock size={32} />}
            color="border-orange-500"
          />
        </div>
      )}

      {/* Сетка информационных блоков */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Последние действия */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-indigo-600" />
            Последние действия
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 pb-3 border-b dark:border-slate-700">
              <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Заказ доставлен</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">5 часов назад</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b dark:border-slate-700">
              <Truck size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Заказ отправлен</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">1 день назад</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Новый заказ ожидает</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2 дня назад</p>
              </div>
            </div>
          </div>
        </div>

        {/* Краткие советы */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-indigo-100 dark:border-indigo-800">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600" />
            Полезные советы
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex gap-2">
              <span className="text-indigo-600">✓</span>
              <span>Оптимизируйте описание товаров для лучшей видимости</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600">✓</span>
              <span>Обновляйте цены и наличие товаров регулярно</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600">✓</span>
              <span>Быстро отвечайте на заказы для лучшего рейтинга</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600">✓</span>
              <span>Проверяйте финансовые отчеты каждую неделю</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="flex">
        {/* Боковая панель */}
        <SidebarNav />

        {/* Основной контент */}
        <main className="flex-1">
          {/* Топ-бар */}
          <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'dashboard' && 'Дашборд'}
                  {activeTab === 'products' && 'Управление товарами'}
                  {activeTab === 'orders' && 'Управление заказами'}
                  {activeTab === 'finance' && 'Финансовые отчеты'}
                  {activeTab === 'settings' && 'Настройки профиля'}
                </h1>
              </div>
            </div>
          </header>

          {/* Контент страницы */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'dashboard' && <DashboardContent />}
            {activeTab === 'products' && <VendorProducts vendorId={user?.objectId || ''} />}
            {activeTab === 'orders' && <VendorOrders vendorId={user?.objectId || ''} />}
            {activeTab === 'finance' && <VendorFinance vendorId={user?.objectId || ''} />}
            {activeTab === 'settings' && <VendorSettings userId={user?.objectId || ''} />}
          </div>
        </main>
      </div>

      {/* Overlay для мобильной боковой панели */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default VendorDashboard;
