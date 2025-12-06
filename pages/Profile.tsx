
import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { ProductCard } from '../components/ProductCard';
import { Back4App, isBack4AppConfigured } from '../services/back4app';
import { 
  User, Package, MapPin, Heart, CreditCard, LogOut, 
  Settings, QrCode, ChevronRight, Gift, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock Data for Profile
const MOCK_ORDERS = [
  { id: 'ORD-9921', date: '12.05.2024', status: 'delivered', total: 4500, items: 3, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=100&q=80' },
  { id: 'ORD-9855', date: '28.04.2024', status: 'processing', total: 1200, items: 1, image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=100&q=80' },
];

const MOCK_ADDRESSES = [
  { id: 1, title: 'Дом', city: 'Сухум', street: 'ул. Аиааира, 15, кв 4', active: true },
  { id: 2, title: 'Работа', city: 'Сухум', street: 'пр. Леона, 2', active: false },
];

type ProfileTab = 'dashboard' | 'orders' | 'settings' | 'addresses' | 'favorites' | 'discount';

export const Profile: React.FC = () => {
  const { user, logout, products, favorites } = useMarket();
  const [activeTab, setActiveTab] = useState<ProfileTab>('dashboard');
  
  // Form state for settings tab
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  // Populate form from Back4App on mount
  useEffect(() => {
    if (isBack4AppConfigured && user) {
      const back4appUser = Back4App.getCurrentUserJson();
      if (back4appUser) {
        setFormData({
          name: back4appUser.name || user.name,
          phone: back4appUser.phone || '',
          email: back4appUser.email || user.email,
          birthDate: '',
          gender: 'male'
        });
      }
    }
  }, [user]);

  // Handle settings save
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      if (isBack4AppConfigured) {
        // Save to Back4App
        const result = await Back4App.updateCurrentUser({
          name: formData.name,
          phone: formData.phone,
        });
        
        if (result) {
          setSaveMessage('✓ Изменения сохранены');
          // Update localStorage as fallback
          localStorage.setItem('user', JSON.stringify({
            ...user,
            name: formData.name,
            email: formData.email
          }));
        } else {
          setSaveMessage('✗ Ошибка при сохранении');
        }
      } else {
        // Mock mode: just save to localStorage
        localStorage.setItem('user', JSON.stringify({
          ...user,
          name: formData.name,
          email: formData.email
        }));
        setSaveMessage('✓ Изменения сохранены (режим демо)');
      }
    } catch (error) {
      console.error('[Profile] Save error:', error);
      setSaveMessage('✗ Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  // If not logged in (though protected by route usually, handle graceful fallback)
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Войдите в профиль</h2>
        <Link to="/login" className="text-indigo-600 hover:underline">Перейти к авторизации</Link>
      </div>
    );
  }

  const renderSidebarItem = (id: ProfileTab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm ${
        activeTab === id 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
      {activeTab === id && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-72 flex-shrink-0">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 md:sticky md:top-24 space-y-2 border border-slate-200 dark:border-slate-800">
            {/* User Info Mini */}
            <div className="flex items-center gap-3 px-2 mb-6 pt-2">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl">
                {(user.name || 'U')[0]}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold truncate dark:text-white">{user.name || 'Unknown'}</div>
                <div className="text-xs text-gray-500 truncate">{user.email || 'no-email'}</div>
              </div>
            </div>

            {renderSidebarItem('dashboard', 'Главная', <User size={18} />)}
            {renderSidebarItem('orders', 'Мои заказы', <Package size={18} />)}
            {renderSidebarItem('favorites', 'Избранное', <Heart size={18} />)}
            {renderSidebarItem('discount', 'Карта лояльности', <CreditCard size={18} />)}
            {renderSidebarItem('addresses', 'Адреса доставки', <MapPin size={18} />)}
            {renderSidebarItem('settings', 'Настройки', <Settings size={18} />)}
            
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
               <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium text-sm"
               >
                  <LogOut size={18} />
                  <span>Выйти из аккаунта</span>
               </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-[500px]">
          
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-2xl font-bold dark:text-white">Личный кабинет</h1>
              
              {/* Discount Card Widget */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden h-48 flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2"><Gift className="w-5 h-5 text-yellow-400"/> Горизонт Platinum</h3>
                    <p className="text-xs text-gray-400">Карта лояльности</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">15%</div>
                    <div className="text-xs text-gray-400">Ваша скидка</div>
                  </div>
                </div>

                <div className="flex justify-between items-end relative z-10">
                   <div>
                     <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Владелец</p>
                     <p className="font-mono text-lg">{user.name.toUpperCase()}</p>
                   </div>
                   <QrCode className="w-12 h-12 text-white/80" />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm">
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{favorites.length}</div>
                    <div className="text-sm text-gray-500">Товаров в избранном</div>
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">12</div>
                    <div className="text-sm text-gray-500">Заказов за год</div>
                 </div>
              </div>

              {/* Last Order Preview */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold dark:text-white">Последний заказ</h3>
                   <Link to="#" onClick={() => setActiveTab('orders')} className="text-indigo-600 text-sm hover:underline">Все заказы</Link>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                      <img src={MOCK_ORDERS[0].image} className="w-full h-full object-cover" alt="order"/>
                   </div>
                   <div className="flex-1">
                      <div className="font-bold dark:text-white">Заказ {MOCK_ORDERS[0].id}</div>
                      <div className="text-sm text-gray-500">Доставлен • {MOCK_ORDERS[0].date}</div>
                   </div>
                   <div className="text-right">
                      <div className="font-bold dark:text-white">{MOCK_ORDERS[0].total} ₽</div>
                      <div className="text-xs text-green-600">Оплачено</div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === 'orders' && (
             <div className="space-y-6 animate-fade-in">
                <h1 className="text-2xl font-bold dark:text-white mb-6">История заказов</h1>
                <div className="space-y-4">
                   {MOCK_ORDERS.map(order => (
                      <div key={order.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-6">
                         <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden">
                             <img src={order.image} className="w-full h-full object-cover" alt="" />
                         </div>
                         <div className="flex-1">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                   <h3 className="font-bold text-lg dark:text-white">Заказ от {order.date}</h3>
                                   <p className="text-sm text-gray-500">{order.id}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {order.status === 'delivered' ? 'Доставлен' : 'В пути'}
                                </span>
                             </div>
                             <div className="flex justify-between items-end mt-4">
                                <div className="text-sm text-gray-500">{order.items} товара</div>
                                <div className="text-xl font-bold dark:text-white">{order.total} ₽</div>
                             </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* FAVORITES */}
          {activeTab === 'favorites' && (
             <div className="space-y-6 animate-fade-in">
                <h1 className="text-2xl font-bold dark:text-white mb-6">Избранное</h1>
                {favoriteProducts.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {favoriteProducts.map(p => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold dark:text-white mb-2">Список пуст</h3>
                        <p className="text-gray-500">Добавляйте товары в избранное, чтобы не потерять.</p>
                    </div>
                )}
             </div>
          )}

          {/* ADDRESSES */}
          {activeTab === 'addresses' && (
             <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold dark:text-white">Адреса доставки</h1>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">Добавить</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MOCK_ADDRESSES.map(addr => (
                        <div key={addr.id} className={`p-6 rounded-xl border-2 cursor-pointer transition ${addr.active ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold dark:text-white">{addr.title}</h3>
                                {addr.active && <CheckCircleIcon />}
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">{addr.city}</p>
                            <p className="text-gray-800 dark:text-white font-medium">{addr.street}</p>
                            <div className="mt-4 flex gap-4 text-sm text-indigo-600 cursor-pointer">
                                <span>Изменить</span>
                                <span className="text-red-500">Удалить</span>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          )}
          
          {/* SETTINGS */}
          {activeTab === 'settings' && (
              <div className="max-w-xl animate-fade-in">
                  <h1 className="text-2xl font-bold dark:text-white mb-6">Личные данные</h1>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Имя</label>
                              <input 
                                  type="text" 
                                  value={formData.name}
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                  className="w-full p-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Телефон</label>
                              <input 
                                  type="text" 
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                  placeholder="+7 (999) 999-99-99"
                                  className="w-full p-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                          <input 
                              type="email" 
                              value={formData.email}
                              disabled
                              className="w-full p-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg bg-gray-50 dark:bg-slate-900 cursor-not-allowed opacity-70"
                          />
                          <p className="text-xs text-gray-400 mt-1">Email нельзя изменить</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Дата рождения</label>
                              <input 
                                  type="date" 
                                  value={formData.birthDate}
                                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                  className="w-full p-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Пол</label>
                              <select 
                                  value={formData.gender}
                                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                                  className="w-full p-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              >
                                  <option value="male">Мужской</option>
                                  <option value="female">Женский</option>
                              </select>
                          </div>
                      </div>

                      {saveMessage && (
                          <div className={`p-3 rounded-lg text-sm font-medium ${
                            saveMessage.includes('✓') 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          }`}>
                              {saveMessage}
                          </div>
                      )}
                      
                      <div className="pt-4">
                          <button 
                              onClick={handleSaveSettings}
                              disabled={isSaving}
                              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                              {isSaving ? (
                                  <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      Сохранение...
                                  </>
                              ) : (
                                  'Сохранить изменения'
                              )}
                          </button>
                      </div>
                  </div>
              </div>
          )}
          
          {/* DISCOUNT */}
          {activeTab === 'discount' && (
              <div className="animate-fade-in">
                  <h1 className="text-2xl font-bold dark:text-white mb-6">Система лояльности</h1>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border dark:border-slate-700 text-center max-w-md mx-auto">
                      <div className="mb-6">
                          <h3 className="text-xl font-bold dark:text-white mb-2">Ваша скидка: 15%</h3>
                          <p className="text-gray-500">Уровень: Platinum</p>
                      </div>
                      
                      <div className="bg-white p-4 inline-block rounded-xl border shadow-sm mb-6">
                           <QrCode className="w-48 h-48 text-slate-900" />
                      </div>
                      <p className="text-sm text-gray-400 mb-6">Покажите этот код на кассе в пункте выдачи</p>
                      
                      <div className="bg-gray-100 dark:bg-slate-700 rounded-full h-3 w-full mb-2 overflow-hidden">
                          <div className="bg-indigo-600 h-full w-[75%]"></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Покупок на 150 000 ₽</span>
                          <span>До уровня Diamond: 50 000 ₽</span>
                      </div>
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};

const CheckCircleIcon = () => (
    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
    </div>
);