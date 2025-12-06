
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  Plus, Wand2, Loader2, LogOut, 
  LayoutDashboard, Store, ShoppingBag, ShoppingCart, 
  Users, Star, Percent, Settings, Check, X as XIcon,
  Search, AlertCircle, MoreHorizontal, Save, ArrowLeft, Ban, PlayCircle, Trash2
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { Product, Category, OrderStatus } from '../types';
import { generateProductDescription } from '../services/gemini';
import { Link, Navigate } from 'react-router-dom';

const SALES_DATA = [
  { name: 'Пн', sales: 4000, traffic: 2400 },
  { name: 'Вт', sales: 3000, traffic: 1398 },
  { name: 'Ср', sales: 2000, traffic: 9800 },
  { name: 'Чт', sales: 2780, traffic: 3908 },
  { name: 'Пт', sales: 1890, traffic: 4800 },
  { name: 'Сб', sales: 2390, traffic: 3800 },
  { name: 'Вс', sales: 3490, traffic: 4300 },
];

type TabType = 'dashboard' | 'sellers' | 'products' | 'orders' | 'users' | 'reviews' | 'marketing' | 'settings';

export const Admin: React.FC = () => {
  const { 
      user, products, addProduct, updateProduct, logout,
      orders, vendors, users, reviews,
      updateOrderStatus, updateVendorStatus, deleteReview, updateUserRole, blockUser
  } = useMarket();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // New Product State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    category: 'Books',
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
    tags: [],
    title: '',
    author: '',
    price: 0,
    description: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Marketing State (Mock)
  const [promos, setPromos] = useState([{code: 'WELCOME', discount: 10, active: true}]);
  const [newPromo, setNewPromo] = useState({code: '', discount: 0});

  if (!user || user.role !== 'admin') {
     return <Navigate to="/login" replace />;
  }

  // --- ACTIONS ---
  
  const handleAIAutoFill = async () => {
      if (!newProduct.title) {
          alert("Введите название товара для генерации");
          return;
      }
      setIsGenerating(true);
      const description = await generateProductDescription(
          newProduct.title, 
          newProduct.author, 
          newProduct.category || 'Books'
      );
      setNewProduct(prev => ({ ...prev, description }));
      setIsGenerating(false);
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
      e.preventDefault();
      if (newProduct.title && newProduct.price) {
          addProduct({
              ...newProduct,
              id: Date.now().toString(),
              rating: 0,
              reviewsCount: 0,
              vendorId: 'admin', 
              status: 'active'
          } as Product);
          alert("Товар добавлен!");
          setNewProduct({ category: 'Books', inStock: true, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80', title: '', author: '', price: 0, description: '' });
      }
  };

  const handleCreatePromo = () => {
      if(!newPromo.code) return;
      setPromos([...promos, { ...newPromo, active: true }]);
      setNewPromo({ code: '', discount: 0 });
  };

  const getSellerName = (vendorId?: string) => {
      if (!vendorId) return 'Маркетплейс';
      const seller = vendors.find(s => s.id === vendorId); // Match context structure
      return seller ? seller.name : vendorId;
  };

  const handleProductStatusChange = (product: Product, status: 'active' | 'blocked' | 'rejected') => {
      updateProduct({ ...product, status });
  };

  const vendorSpecificProducts = selectedVendorId 
      ? products.filter(p => p.vendorId === selectedVendorId)
      : [];

  const currentVendor = selectedVendorId 
      ? vendors.find(s => s.id === selectedVendorId) 
      : null;

  const renderSidebarItem = (id: TabType, label: string, icon: React.ReactNode) => (
    <button 
        onClick={() => { setActiveTab(id); setSelectedVendorId(null); }}
        className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${activeTab === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
        {icon}
        <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-4 hidden md:flex flex-col border-r border-slate-800">
        <div className="flex items-center gap-2 mb-8 px-2">
           <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">A</div>
           <span className="text-xl font-bold">Admin Panel</span>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto">
            {renderSidebarItem('dashboard', 'Дашборд', <LayoutDashboard size={20}/>)}
            {renderSidebarItem('orders', 'Заказы', <ShoppingCart size={20}/>)}
            {renderSidebarItem('sellers', 'Продавцы', <Store size={20}/>)}
            {renderSidebarItem('products', 'Товары', <ShoppingBag size={20}/>)}
            {renderSidebarItem('users', 'Пользователи', <Users size={20}/>)}
            {renderSidebarItem('reviews', 'Отзывы', <Star size={20}/>)}
            {renderSidebarItem('marketing', 'Маркетинг', <Percent size={20}/>)}
            {renderSidebarItem('settings', 'Настройки', <Settings size={20}/>)}
        </nav>
        
        <div className="pt-4 border-t border-slate-800 mt-4 space-y-2">
            <Link to="/" className="block px-4 py-2 text-slate-400 hover:text-white text-sm">← Вернуться в магазин</Link>
            <button onClick={logout} className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 flex items-center gap-2 text-sm">
                <LogOut className="w-4 h-4" /> Выйти
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col h-screen">
        {/* Top Header */}
        <header className="bg-white dark:bg-slate-800 h-16 border-b dark:border-slate-700 flex items-center justify-between px-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize flex items-center gap-2">
                {selectedVendorId && (
                   <button onClick={() => setSelectedVendorId(null)} className="hover:bg-gray-100 dark:hover:bg-slate-700 p-1 rounded-full mr-2">
                       <ArrowLeft className="w-5 h-5"/>
                   </button>
                )}
                {selectedVendorId ? `Управление: ${currentVendor?.name}` : (
                    activeTab === 'dashboard' ? 'Обзор системы' : 
                    activeTab === 'sellers' ? 'Управление продавцами' :
                    activeTab === 'products' ? 'Каталог товаров' :
                    activeTab === 'orders' ? 'Обработка заказов' :
                    activeTab === 'users' ? 'База клиентов' :
                    activeTab === 'reviews' ? 'Модерация отзывов' :
                    activeTab === 'marketing' ? 'Акции и скидки' : 'Настройки системы'
                )}
            </h2>
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                    A
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900">
            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Всего заказов', val: orders.length, change: 'total', color: 'bg-blue-100 text-blue-700' },
                            { label: 'Пользователей', val: users.length, change: 'active', color: 'bg-green-100 text-green-700' },
                            { label: 'Продавцов', val: vendors.length, change: 'partners', color: 'bg-purple-100 text-purple-700' },
                            { label: 'Товаров', val: products.length, change: 'catalog', color: 'bg-orange-100 text-orange-700' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700">
                                <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-2">{stat.label}</h3>
                                <div className="flex justify-between items-end">
                                    <span className="text-2xl font-bold dark:text-white">{stat.val}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${stat.color}`}>{stat.change}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 h-96">
                            <h3 className="font-bold mb-4 dark:text-white">Динамика продаж</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={SALES_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                    <XAxis dataKey="name" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                    <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 h-96">
                            <h3 className="font-bold mb-4 dark:text-white">Новые пользователи</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={SALES_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                    <XAxis dataKey="name" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                    <Line type="monotone" dataKey="traffic" stroke="#10b981" strokeWidth={2} dot={{r: 4}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* ORDERS (Full Functional) */}
            {activeTab === 'orders' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold dark:text-white mb-4">Управление заказами ({orders.length})</h2>
                    {orders.length === 0 ? (
                        <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 text-gray-500">
                             Нет заказов для отображения. Оформите заказ через корзину.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {orders.map(order => (
                                <div key={order.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 flex flex-col lg:flex-row items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-bold text-lg dark:text-white">{order.id}</span>
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${
                                                order.status === 'new' ? 'bg-yellow-100 text-yellow-700' :
                                                order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {order.customerName} ({order.phone}) • {order.items.length} товаров • {order.date}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {order.city}, {order.address}
                                        </div>
                                    </div>
                                    
                                    <div className="text-xl font-bold dark:text-white">{order.total} ₽</div>

                                    <div className="flex items-center gap-2">
                                        <select 
                                            className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                        >
                                            <option value="new">Новый</option>
                                            <option value="processing">В работе</option>
                                            <option value="shipped">Отправлен</option>
                                            <option value="delivered">Доставлен</option>
                                            <option value="cancelled">Отменен</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SELLERS */}
            {activeTab === 'sellers' && !selectedVendorId && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 font-medium border-b dark:border-slate-700">
                            <tr>
                                <th className="p-4">Название продавца</th>
                                <th className="p-4">Статус</th>
                                <th className="p-4">Рейтинг</th>
                                <th className="p-4">Оборот</th>
                                <th className="p-4 text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {vendors.sort((a,b) => (a.status === 'pending' ? -1 : 1)).map(seller => (
                                <tr key={seller.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4 font-medium dark:text-white">
                                        {seller.name}
                                        <div className="text-xs text-gray-400">ID: {seller.id}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            seller.status === 'active' ? 'bg-green-100 text-green-700' :
                                            seller.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {seller.status === 'active' ? 'Активен' : seller.status === 'pending' ? 'Ожидает' : 'Заблокирован'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex items-center gap-1 dark:text-gray-300">
                                        <Star className="w-4 h-4 text-yellow-400 fill-current"/> {seller.rating > 0 ? seller.rating : '-'}
                                    </td>
                                    <td className="p-4 dark:text-gray-300">{seller.revenue} ₽</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        {seller.status === 'pending' && (
                                            <button 
                                                onClick={() => updateVendorStatus(seller.id, 'active')}
                                                className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"
                                            >
                                                Одобрить
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setSelectedVendorId(seller.id)}
                                            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                                        >
                                            Управление
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* VENDOR DETAILS */}
            {activeTab === 'sellers' && selectedVendorId && currentVendor && (
                <div className="space-y-6">
                    <div className="flex gap-4 mb-4">
                         <button 
                             onClick={() => updateVendorStatus(currentVendor.id, 'active')}
                             className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                         >
                             Активировать
                         </button>
                         <button 
                             onClick={() => updateVendorStatus(currentVendor.id, 'blocked')}
                             className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700"
                         >
                             Блокировать
                         </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
                        <div className="p-4 border-b dark:border-slate-700">
                            <h3 className="font-bold text-lg dark:text-white">Товары продавца</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="p-4">Товар</th>
                                    <th className="p-4">Цена</th>
                                    <th className="p-4">Статус</th>
                                    <th className="p-4 text-right">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {vendorSpecificProducts.map(p => (
                                    <tr key={p.id}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={p.image} className="w-10 h-10 rounded object-cover" alt="" />
                                                <div className="dark:text-white">{p.title}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 dark:text-white">{p.price} ₽</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs ${p.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {p.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {p.status === 'blocked' ? (
                                                <button onClick={() => handleProductStatusChange(p, 'active')} className="text-green-600"><PlayCircle size={18}/></button>
                                            ) : (
                                                <button onClick={() => handleProductStatusChange(p, 'blocked')} className="text-red-600"><Ban size={18}/></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* USERS */}
            {activeTab === 'users' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
                     <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 font-medium">
                            <tr>
                                <th className="p-4">Имя</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Роль</th>
                                <th className="p-4">Статус</th>
                                <th className="p-4 text-right">Управление</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td className="p-4 font-medium dark:text-white">{u.name}</td>
                                    <td className="p-4 text-gray-500">{u.email}</td>
                                    <td className="p-4">
                                        <select 
                                            value={u.role}
                                            onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                                            className="p-1 border rounded text-sm dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="user">Покупатель</option>
                                            <option value="vendor">Продавец</option>
                                            <option value="admin">Администратор</option>
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        {u.isBlocked ? <span className="text-red-500 font-bold">Блок</span> : <span className="text-green-500">Активен</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => blockUser(u.id, !u.isBlocked)}
                                            className={`text-xs font-bold px-3 py-1 rounded ${u.isBlocked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                        >
                                            {u.isBlocked ? 'Разблокировать' : 'Блокировать'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                </div>
            )}

            {/* REVIEWS */}
            {activeTab === 'reviews' && (
                <div className="space-y-4">
                    {reviews.length === 0 ? <p className="text-gray-500">Отзывов пока нет.</p> : reviews.map(review => (
                        <div key={review.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 flex justify-between items-start">
                             <div>
                                 <div className="flex items-center gap-2 mb-1">
                                     <span className="font-bold dark:text-white">{review.userName}</span>
                                     <span className="text-yellow-400 flex text-sm"><Star size={14} fill="currentColor"/> {review.rating}</span>
                                 </div>
                                 <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
                                 <div className="text-xs text-gray-400 mt-2">ID товара: {review.productId}</div>
                             </div>
                             <button onClick={() => deleteReview(review.id)} className="text-red-400 hover:text-red-600">
                                 <Trash2 size={18} />
                             </button>
                        </div>
                    ))}
                </div>
            )}

            {/* MARKETING */}
            {activeTab === 'marketing' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700">
                        <h3 className="font-bold dark:text-white mb-4">Создать промокод</h3>
                        <div className="flex gap-4">
                            <input 
                                type="text" 
                                placeholder="Код (например SALE20)" 
                                className="flex-1 p-2 border rounded dark:bg-slate-700 dark:text-white"
                                value={newPromo.code}
                                onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                            />
                            <input 
                                type="number" 
                                placeholder="Скидка %" 
                                className="w-32 p-2 border rounded dark:bg-slate-700 dark:text-white"
                                value={newPromo.discount}
                                onChange={e => setNewPromo({...newPromo, discount: Number(e.target.value)})}
                            />
                            <button onClick={handleCreatePromo} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">Создать</button>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                         {promos.map((p, i) => (
                             <div key={i} className="flex justify-between bg-white dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700">
                                 <span className="font-mono font-bold text-lg dark:text-white">{p.code}</span>
                                 <span className="text-green-600 font-bold">-{p.discount}%</span>
                             </div>
                         ))}
                    </div>
                </div>
            )}

            {/* PRODUCTS & SETTINGS (Simplified for brevity as Products is same as Vendor) */}
            {activeTab === 'products' && (
                <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700">
                    <h3 className="font-bold mb-4 dark:text-white">Добавление товаров (Администратор)</h3>
                    <p className="text-gray-500 mb-6">Вы можете добавлять товары от имени магазина напрямую.</p>
                     <form onSubmit={handleSubmitProduct} className="max-w-md mx-auto space-y-4 text-left">
                            <input 
                                type="text" 
                                placeholder="Название"
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white"
                                value={newProduct.title}
                                onChange={e => setNewProduct({...newProduct, title: e.target.value})}
                            />
                            <input 
                                type="number" 
                                placeholder="Цена"
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white"
                                value={newProduct.price}
                                onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                            />
                             <button type="button" onClick={handleAIAutoFill} className="text-indigo-600 text-sm flex items-center gap-1">
                                {isGenerating ? <Loader2 className="animate-spin w-4 h-4"/> : <Wand2 className="w-4 h-4"/>} 
                                Сгенерировать описание
                             </button>
                            <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded">Добавить</button>
                     </form>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="p-8 text-center">
                    <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700">
                        Перезагрузить систему
                    </button>
                </div>
            )}

        </main>
      </div>
    </div>
  );
};
