
import React, { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Plus, Wand2, Loader2, LogOut, 
  LayoutDashboard, ShoppingBag, ShoppingCart, 
  Settings, Search, Truck, BadgeDollarSign, Megaphone,
  Package, FileText, CheckCircle, AlertTriangle, Printer, Percent, X, Edit, Upload, Image as ImageIcon
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { Product, Category, VendorProductStatus, Shipment, Transaction, LogisticsModel } from '../types';
import { generateProductDescription } from '../services/gemini';
import { Link, Navigate } from 'react-router-dom';

// --- MOCK DATA FOR VENDOR DEMO ---
const VENDOR_SALES_DATA = [
  { name: 'Пн', sales: 1200 },
  { name: 'Вт', sales: 1500 },
  { name: 'Ср', sales: 800 },
  { name: 'Чт', sales: 2100 },
  { name: 'Пт', sales: 900 },
  { name: 'Сб', sales: 1800 },
  { name: 'Вс', sales: 2500 },
];

const MOCK_SHIPMENTS: Shipment[] = [
    { id: 'SH-1001', date: '2024-03-20', warehouse: 'Склад Сухум', itemsCount: 150, status: 'processed', skuList: ['1', '2'] },
    { id: 'SH-1002', date: '2024-03-25', warehouse: 'Склад Гагра', itemsCount: 50, status: 'planned', skuList: ['3'] }
];

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 'TR-500', date: '2024-03-18', amount: 15000, type: 'payout', description: 'Выплата за период 10.03-17.03', status: 'completed' },
    { id: 'TR-501', date: '2024-03-19', amount: -500, type: 'logistics', description: 'Хранение FBO', status: 'completed' },
    { id: 'TR-502', date: '2024-03-20', amount: 4500, type: 'sale', description: 'Продажа #ORD-7782', status: 'completed' }
];

type TabType = 'dashboard' | 'products' | 'orders' | 'logistics' | 'finance' | 'marketing' | 'profile';

export const VendorDashboard: React.FC = () => {
  const { user, products, addProduct, updateProduct, logout } = useMarket();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Filter products by current vendor
  const vendorProducts = products.filter(p => p.vendorId === user?.vendorId);

  // --- PRODUCT FORM WIZARD STATE ---
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    category: 'Books',
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    image: '',
    tags: [],
    title: '',
    author: '',
    price: 0,
    description: '',
    status: 'draft',
    specs: {}
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- MARKDOWN STATE ---
  const [markdownProduct, setMarkdownProduct] = useState<Product | null>(null);
  const [newMarkdownPrice, setNewMarkdownPrice] = useState<number>(0);

  // --- LOGISTICS STATE ---
  const [shipments, setShipments] = useState<Shipment[]>(MOCK_SHIPMENTS);
  const [logisticsModel, setLogisticsModel] = useState<LogisticsModel>('FBS'); // Default state for demo

  if (!user || user.role !== 'vendor') {
     return <Navigate to="/login" replace />;
  }

  // --- HANDLERS ---

  const handleAIAutoFill = async () => {
      if (!newProduct.title) return alert("Введите название товара");
      setIsGenerating(true);
      const description = await generateProductDescription(
          newProduct.title, 
          newProduct.author, 
          newProduct.category || 'Books'
      );
      setNewProduct(prev => ({ ...prev, description }));
      setIsGenerating(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProduct = (product: Product) => {
      setNewProduct(product);
      setEditingProductId(product.id);
      setIsCreatingProduct(true);
  };

  const handleResetForm = () => {
      setIsCreatingProduct(false);
      setEditingProductId(null);
      setNewProduct({ 
        category: 'Books', 
        inStock: true, 
        image: '', 
        title: '', 
        author: '', 
        price: 0, 
        description: '', 
        status: 'draft',
        rating: 0,
        reviewsCount: 0,
        tags: []
      });
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
      e.preventDefault();
      
      const imageToUse = newProduct.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80';

      if (editingProductId) {
          // UPDATE EXISTING
          const updatedProduct = {
              ...newProduct,
              image: imageToUse,
              id: editingProductId,
              // Preserve fields that shouldn't change or are managed elsewhere
              status: newProduct.status // Allow updating status or keep existing
          } as Product;
          
          updateProduct(updatedProduct);
          alert("Товар обновлен успешно!");
      } else {
          // CREATE NEW
          const productToAdd = {
              ...newProduct,
              id: Date.now().toString(),
              rating: 0,
              reviewsCount: 0,
              vendorId: user.vendorId,
              status: 'active', // Immediately active
              image: imageToUse
          } as Product;
          
          addProduct(productToAdd);
          alert("Товар опубликован и доступен в каталоге!");
      }
      
      handleResetForm();
  };

  const handleOpenMarkdown = (product: Product) => {
      setMarkdownProduct(product);
      setNewMarkdownPrice(Math.floor(product.price * 0.9)); // Default to 10% off suggestion
  };

  const handleSaveMarkdown = (e: React.FormEvent) => {
      e.preventDefault();
      if (!markdownProduct) return;
      if (newMarkdownPrice >= markdownProduct.price) {
          alert("Новая цена должна быть ниже текущей для уценки!");
          return;
      }

      const updatedProduct = {
          ...markdownProduct,
          price: newMarkdownPrice,
          oldPrice: markdownProduct.price // Store current price as old price
      };

      updateProduct(updatedProduct);
      setMarkdownProduct(null);
      alert("Уценка применена успешно!");
  };

  const handleCreateShipment = () => {
      const newShipment: Shipment = {
          id: `SH-${Math.floor(Math.random() * 10000)}`,
          date: new Date().toISOString().split('T')[0],
          warehouse: 'Склад Сухум',
          itemsCount: 0,
          status: 'planned',
          skuList: []
      };
      setShipments([newShipment, ...shipments]);
  };

  const renderSidebarItem = (id: TabType, label: string, icon: React.ReactNode) => (
    <button 
        onClick={() => { setActiveTab(id); handleResetForm(); }}
        className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${activeTab === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
        {icon}
        <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300 relative">
      {/* Markdown Modal */}
      {markdownProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl max-w-sm w-full border dark:border-slate-700 animate-fade-in-up">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                          <Percent className="w-5 h-5 text-red-500"/> Уценка товара
                      </h3>
                      <button onClick={() => setMarkdownProduct(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                          <X className="w-5 h-5"/>
                      </button>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <img src={markdownProduct.image} className="w-12 h-12 object-cover rounded" alt="" />
                      <div>
                          <div className="font-bold text-sm dark:text-white line-clamp-1">{markdownProduct.title}</div>
                          <div className="text-xs text-gray-500">Текущая цена: {markdownProduct.price} ₽</div>
                      </div>
                  </div>

                  <form onSubmit={handleSaveMarkdown}>
                      <div className="mb-4">
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Новая цена (₽)</label>
                          <input 
                              type="number" 
                              className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white text-lg font-bold"
                              value={newMarkdownPrice}
                              onChange={e => setNewMarkdownPrice(Number(e.target.value))}
                              min="0"
                              required
                          />
                          {newMarkdownPrice > 0 && newMarkdownPrice < markdownProduct.price && (
                              <div className="mt-2 text-sm text-green-600 font-medium">
                                  Скидка: {Math.round(((markdownProduct.price - newMarkdownPrice) / markdownProduct.price) * 100)}%
                              </div>
                          )}
                      </div>
                      
                      <button type="submit" className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">
                          Применить уценку
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-4 hidden md:flex flex-col border-r border-slate-800">
        <div className="flex items-center gap-2 mb-8 px-2">
           <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center font-bold">V</div>
           <div className="flex flex-col">
             <span className="text-lg font-bold">Vendor Panel</span>
             <span className="text-xs text-gray-400 truncate w-32">{user.name}</span>
           </div>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto">
            {renderSidebarItem('dashboard', 'Дашборд', <LayoutDashboard size={20}/>)}
            {renderSidebarItem('products', 'Товары', <ShoppingBag size={20}/>)}
            {renderSidebarItem('orders', 'Заказы FBS', <ShoppingCart size={20}/>)}
            {renderSidebarItem('logistics', 'Поставки FBO', <Truck size={20}/>)}
            {renderSidebarItem('finance', 'Финансы', <BadgeDollarSign size={20}/>)}
            {renderSidebarItem('marketing', 'Маркетинг', <Megaphone size={20}/>)}
            {renderSidebarItem('profile', 'Настройки', <Settings size={20}/>)}
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
            <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize">
                {activeTab === 'dashboard' ? 'Обзор бизнеса' : 
                 activeTab === 'products' ? 'Управление ассортиментом' :
                 activeTab === 'logistics' ? 'Управление поставками' :
                 activeTab === 'finance' ? 'Финансовые отчеты' : activeTab}
            </h2>
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                    {user.name[0]}
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900">
            
            {/* --- DASHBOARD TAB --- */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700">
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-2">Выручка (неделя)</h3>
                            <span className="text-2xl font-bold dark:text-white">45,200 ₽</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700">
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-2">Заказов к отгрузке</h3>
                            <span className="text-2xl font-bold text-orange-600">3</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700">
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-2">Активные товары</h3>
                            <span className="text-2xl font-bold dark:text-white">{vendorProducts.filter(p => p.inStock).length}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700">
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-2">Рейтинг продавца</h3>
                            <span className="text-2xl font-bold text-yellow-500">4.9 ★</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 h-96">
                        <h3 className="font-bold mb-4 dark:text-white">Динамика продаж</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={VENDOR_SALES_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* --- PRODUCTS TAB --- */}
            {activeTab === 'products' && (
                <div>
                    {!isCreatingProduct ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100">Все</button>
                                    <button className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Активные</button>
                                    <button className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Заблокированные</button>
                                </div>
                                <button onClick={() => { handleResetForm(); setIsCreatingProduct(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-indigo-700">
                                    <Plus className="w-4 h-4"/> Создать карточку
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Фото</th>
                                            <th className="p-4">Наименование / Артикул</th>
                                            <th className="p-4">Категория</th>
                                            <th className="p-4 text-right">Цена</th>
                                            <th className="p-4 text-center">Статус</th>
                                            <th className="p-4 text-right">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {vendorProducts.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                <td className="p-4"><img src={p.image} className="w-12 h-16 object-cover rounded bg-gray-100" alt="" /></td>
                                                <td className="p-4">
                                                    <div className="font-medium dark:text-white">{p.title}</div>
                                                    <div className="text-xs text-gray-400">{p.id}</div>
                                                </td>
                                                <td className="p-4 text-sm dark:text-gray-300">{p.category}</td>
                                                <td className="p-4 text-right font-medium dark:text-white">
                                                    {p.price} ₽
                                                    {p.oldPrice && (
                                                        <div className="text-xs text-red-500 line-through">{p.oldPrice} ₽</div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {p.status === 'moderation' ? (
                                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">На проверке</span>
                                                    ) : p.status === 'blocked' ? (
                                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Заблокирован</span>
                                                    ) : p.status === 'draft' ? (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold">Черновик</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Активен</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleEditProduct(p)}
                                                            className="p-2 text-gray-500 hover:text-indigo-600 transition" 
                                                            title="Редактировать"
                                                        >
                                                            <Edit className="w-5 h-5"/>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleOpenMarkdown(p)}
                                                            className="p-2 text-gray-500 hover:text-red-600 transition" 
                                                            title="Уценка (Markdown)"
                                                        >
                                                            <Percent className="w-5 h-5"/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {vendorProducts.length === 0 && (
                                    <div className="p-8 text-center text-gray-500">У вас пока нет товаров.</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // CREATE/EDIT PRODUCT WIZARD
                        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold dark:text-white">
                                    {editingProductId ? 'Редактирование товара' : 'Создание карточки товара'}
                                </h2>
                                <button onClick={handleResetForm} className="text-gray-500 hover:text-gray-700">Отмена</button>
                            </div>

                            <form onSubmit={handleSubmitProduct} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Категория</label>
                                        <select 
                                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            value={newProduct.category}
                                            onChange={e => setNewProduct({...newProduct, category: e.target.value as Category})}
                                        >
                                            <option value="Books">Книги</option>
                                            <option value="Clothes">Одежда</option>
                                            <option value="Electronics">Электроника</option>
                                            <option value="Home">Дом</option>
                                            <option value="Stationery">Канцелярия</option>
                                            {/* Add others as needed */}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Бренд / Автор</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            value={newProduct.author}
                                            onChange={e => setNewProduct({...newProduct, author: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Название товара</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        value={newProduct.title}
                                        onChange={e => setNewProduct({...newProduct, title: e.target.value})}
                                        placeholder="Например: Смартфон iPhone 15 Pro"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Цена (₽)</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            value={newProduct.price}
                                            onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Цена до скидки (₽)</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            value={newProduct.oldPrice || ''}
                                            onChange={e => setNewProduct({...newProduct, oldPrice: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Артикул продавца</label>
                                        <input type="text" className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="ART-001"/>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium dark:text-gray-300">Описание</label>
                                        <button 
                                            type="button" 
                                            onClick={handleAIAutoFill}
                                            disabled={isGenerating}
                                            className="text-xs text-indigo-600 flex items-center gap-1 hover:underline"
                                        >
                                            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                                            Сгенерировать с AI
                                        </button>
                                    </div>
                                    <textarea 
                                        className="w-full p-2 border rounded h-32 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        value={newProduct.description}
                                        onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                                    />
                                </div>
                                
                                {/* Photo Upload Section */}
                                <div 
                                    className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 text-center bg-gray-50 dark:bg-slate-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition relative overflow-hidden"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {newProduct.image ? (
                                        <div className="flex flex-col items-center">
                                            <img src={newProduct.image} alt="Preview" className="h-48 object-contain mb-4 rounded-lg shadow-sm"/>
                                            <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4"/> Изображение загружено
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2">Нажмите, чтобы заменить</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                                                <Upload className="w-6 h-6"/>
                                            </div>
                                            <div className="text-gray-500 mb-2">Перетащите фото сюда или нажмите для загрузки</div>
                                            <button type="button" className="px-4 py-2 bg-white border dark:bg-slate-700 dark:border-slate-600 rounded shadow-sm text-sm dark:text-white">
                                                Выбрать файл
                                            </button>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4 border-t dark:border-slate-700">
                                    <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">
                                        {editingProductId ? 'Сохранить изменения' : 'Опубликовать в каталог'}
                                    </button>
                                    {!editingProductId && (
                                        <button type="button" className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 dark:bg-slate-700 dark:text-white">
                                            Сохранить черновик
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* --- LOGISTICS TAB (FBO) --- */}
            {activeTab === 'logistics' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold dark:text-white">Поставки FBO</h2>
                        <button onClick={handleCreateShipment} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-indigo-700">
                            <Plus className="w-4 h-4"/> Создать поставку
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {shipments.map(s => (
                            <div key={s.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 flex flex-col md:flex-row items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-bold text-lg dark:text-white">Поставка {s.id}</span>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${
                                            s.status === 'processed' ? 'bg-green-100 text-green-700' : 
                                            s.status === 'accepted' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {s.status === 'planned' ? 'Планируется' : s.status === 'accepted' ? 'Принята' : 'Обработана'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {s.date} • {s.warehouse} • {s.itemsCount > 0 ? `${s.itemsCount} товаров` : 'Черновик'}
                                    </div>
                                </div>
                                
                                <div className="flex gap-3">
                                    <button className="p-2 text-gray-500 hover:text-indigo-600 border rounded hover:bg-gray-50 dark:border-slate-600 dark:text-gray-400" title="Штрихкоды">
                                        <Printer className="w-5 h-5"/>
                                    </button>
                                    <button className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 dark:bg-slate-700 dark:text-white">
                                        Редактировать
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- FINANCE TAB --- */}
            {activeTab === 'finance' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700">
                            <h3 className="text-sm text-gray-500 mb-1">Текущий баланс</h3>
                            <div className="text-2xl font-bold dark:text-white">12,500 ₽</div>
                            <div className="text-xs text-green-600 mt-2">Доступно к выводу</div>
                         </div>
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700">
                             <h3 className="text-sm text-gray-500 mb-1">К выплате (14 дней)</h3>
                             <div className="text-2xl font-bold dark:text-white">35,000 ₽</div>
                         </div>
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700">
                             <h3 className="text-sm text-gray-500 mb-1">Удержания / Штрафы</h3>
                             <div className="text-2xl font-bold text-red-500">-500 ₽</div>
                         </div>
                    </div>

                    <h3 className="font-bold text-lg dark:text-white mt-8">История операций</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="p-4">Дата / ID</th>
                                    <th className="p-4">Тип</th>
                                    <th className="p-4">Описание</th>
                                    <th className="p-4 text-right">Сумма</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {MOCK_TRANSACTIONS.map(tr => (
                                    <tr key={tr.id}>
                                        <td className="p-4">
                                            <div className="font-medium dark:text-white">{tr.date}</div>
                                            <div className="text-xs text-gray-400">{tr.id}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                tr.type === 'payout' ? 'bg-purple-100 text-purple-700' :
                                                tr.type === 'sale' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {tr.type === 'payout' ? 'Выплата' : tr.type === 'sale' ? 'Продажа' : 'Удержание'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm dark:text-gray-300">{tr.description}</td>
                                        <td className={`p-4 text-right font-bold ${tr.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {tr.amount > 0 ? '+' : ''}{tr.amount} ₽
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* --- ORDERS TAB --- */}
            {activeTab === 'orders' && (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
                    <h3 className="text-xl font-bold dark:text-white mb-2">Нет активных заказов FBS</h3>
                    <p className="text-gray-500">Заказы для самостоятельной сборки появятся здесь.</p>
                </div>
            )}

            {/* --- PROFILE TAB --- */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold dark:text-white">Настройки профиля</h2>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 space-y-4 max-w-2xl">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Название магазина</label>
                            <input type="text" className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" defaultValue="My Best Shop"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Модель работы</label>
                            <select 
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={logisticsModel}
                                onChange={(e) => setLogisticsModel(e.target.value as LogisticsModel)}
                            >
                                <option value="FBS">FBS - Доставка от Горизонта</option>
                                <option value="FBO">FBO - Со склада Горизонта</option>
                                <option value="CNC">C&C - Самовывоз из магазина</option>
                                <option value="DBS">DBS - Доставка продавцом</option>
                            </select>
                        </div>
                         <button className="px-6 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700">Сохранить</button>
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};
