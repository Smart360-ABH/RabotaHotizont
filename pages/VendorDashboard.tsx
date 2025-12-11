import React from 'react';
import { Plus, LayoutDashboard, ShoppingBag, ShoppingCart, Settings, Package, Edit2, Trash2, Loader, Upload, ArrowUpDown, CheckSquare, Square } from 'lucide-react';
import { useUser } from '../context/UserContext';
import AddProductForm from '../components/AddProductForm';
import { CsvUpload } from '../components/CsvUpload';
import { Navigate } from 'react-router-dom';
import * as back4app from '../services/back4appRest';
import { calculateDelivery, formatDeliveryDate } from '../services/logistics';
import { Truck } from 'lucide-react';

type TabType = 'dashboard' | 'products' | 'orders' | 'settings';

interface VendorProduct {
  objectId: string;
  title: string;
  price: number;
  stock?: number;
  category?: string;
  description?: string;
  vendorId?: string;

  image?: string;
  imageUrl?: string;
  status?: string;
}

interface Order {
  objectId: string;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
  customerName?: string;
  email?: string;
  phone?: string;
}

// PII Masking Utilities
const maskName = (name: string = 'Unknown') => {
  return name.charAt(0) + '***';
};

const maskEmail = (email: string = '') => {
  if (!email) return '***@***.com';
  const [user, domain] = email.split('@');
  return user.charAt(0) + '***@' + domain;
};

const maskPhone = (phone: string = '') => {
  if (!phone) return '+7 *** *** ** **';
  return phone.slice(0, 4) + ' *** *** ' + phone.slice(-2);
};

const translateStatus = (status: string) => {
  const map: any = { 'pending': 'Новый', 'processing': 'В обработке', 'shipped': 'Отправлен', 'completed': 'Выполнен', 'cancelled': 'Отменен' };
  return map[status] || status;
};

export const VendorDashboard: React.FC = () => {
  const { user, logout } = useUser();
  const [activeTab, setActiveTab] = React.useState<TabType>('dashboard');
  const [vendorProducts, setVendorProducts] = React.useState<VendorProduct[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);
  const [showCsv, setShowCsv] = React.useState(false);

  // New features state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = React.useState({ key: 'title', direction: 'asc' });

  // Orders State
  const [vendorOrders, setVendorOrders] = React.useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);

  // Sorting Logic
  const sortedProducts = React.useMemo(() => {
    let sortable = [...vendorProducts];
    if (sortConfig.key) {
      sortable.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [vendorProducts, sortConfig]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === vendorProducts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(vendorProducts.map(p => p.objectId)));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Удалить выбранные товары (${selectedIds.size})?`)) return;
    setLoading(true);
    let successCount = 0;
    let failCount = 0;
    let lastError = '';

    const ids = Array.from(selectedIds);
    try {
      // Process sequentially to avoid rate limiting
      for (const id of ids) {
        try {
          await back4app.deleteProduct(String(id));
          setVendorProducts(prev => prev.filter(p => p.objectId !== id));
          // Remove from selection as we go (optional, but good visual feedback if we updated state here)
          // But we'll verify connection first. Better to update local state optimistically or after loop.
          successCount++;
        } catch (e: any) {
          console.error(`Failed to delete ${id}`, e);
          failCount++;
          lastError = e.message || String(e);
        }
      }

      // Update selection to remove deleted items
      const newSet = new Set(selectedIds);
      // We are simpler: we re-filter vendorProducts based on success
      // Actually we've been filtering vendorProducts iteratively above? 
      // No, setVendorProducts above relies on functional update, that works.

      // Re-cleanup selection for deleted items
      setVendorProducts(current => {
        const survivors = current.map(p => p.objectId);
        setSelectedIds(prev => {
          const next = new Set(prev);
          ids.forEach(id => { if (!survivors.includes(id)) next.delete(id); });
          return next;
        });
        return current;
      });

      if (failCount > 0) {
        alert(`Удалено: ${successCount}. Ошибок: ${failCount}.\nПоследняя ошибка: ${lastError}`);
      } else {
        // If all success, clear selection fully
        setSelectedIds(new Set());
      }

    } catch (err: any) {
      alert('Критическая ошибка при удалении: ' + (err.message || err));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const load = async () => {
      if (!user?.objectId) return;
      setLoading(true);
      try {
        const all = await back4app.getProducts(200);
        const list = Array.isArray(all) ? all : (all && Array.isArray((all as any).results) ? (all as any).results : []);
        // Map raw parse objects to VendorProduct
        const mapped = (list || []).filter((p: any) => p.vendorId === user.objectId).map((p: any) => ({
          objectId: p.objectId,
          title: p.title,
          price: p.price,
          stock: p.stock,
          category: p.category,
          description: p.description,
          vendorId: p.vendorId,
          image: p.image ? (p.image.url || p.image) : undefined,
          imageUrl: p.imageUrl,
          status: p.status
        }));
        setVendorProducts(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Load Orders
  React.useEffect(() => {
    if (activeTab === 'orders' && user?.objectId) {
      const loadOrders = async () => {
        setOrdersLoading(true);
        try {
          // Mock fetching orders logic since backend might return empty
          const dummy: Order[] = [
            { objectId: 'ORD-001', items: [{ title: 'Товар 1', price: 1000, quantity: 1 }], total: 1000, status: 'processing', createdAt: new Date().toISOString(), customerName: 'Ivan Ivanov', email: 'ivanov@example.com', phone: '+79991234567' },
            { objectId: 'ORD-002', items: [{ title: 'Товар 2', price: 2500, quantity: 2 }], total: 5000, status: 'completed', createdAt: new Date(Date.now() - 86400000).toISOString(), customerName: 'Elena Petrova', email: 'elena.p@mail.ru', phone: '+79031112233' }
          ];
          setVendorOrders(dummy);
        } catch (e) { console.error(e); }
        finally { setOrdersLoading(false); }
      };
      loadOrders();
    }
  }, [activeTab, user]);



  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'vendor') return <Navigate to="/login" replace />;

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить товар?')) return;
    try {
      await back4app.deleteProduct(id);
      setVendorProducts(prev => prev.filter(p => p.objectId !== id));
    } catch (err) {
      console.error(err);
      alert('Ошибка удаления');
    }
  };

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <div className="font-bold text-lg">Панель продавца</div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 border rounded">
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Sidebar - Hidden on mobile unless toggled */}
        <aside className={`w-full md:w-64 ${mobileMenuOpen ? 'block' : 'hidden'} md:block mb-6 md:mb-0`}>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-800 space-y-2">
            <div className="font-bold text-lg">Панель продавца</div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-3 py-2 rounded ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}
            >
              <LayoutDashboard className="inline mr-2" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full text-left px-3 py-2 rounded ${activeTab === 'products' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}
            >
              <ShoppingBag className="inline mr-2" /> Товары
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-3 py-2 rounded ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}
            >
              <ShoppingCart className="inline mr-2" /> Заказы
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-3 py-2 rounded ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}
            >
              <Settings className="inline mr-2" /> Настройки
            </button>
            <div className="border-t pt-2 mt-2">
              <button onClick={logout} className="w-full text-left px-3 py-2 rounded text-red-600">Выйти</button>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <div className="text-sm text-gray-500">{vendorProducts.length} товаров</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded shadow">
                  <h3 className="font-bold mb-2">Краткая статистика</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 rounded">
                      Товары
                      <div className="font-bold mt-1">{vendorProducts.length}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded">
                      Заказы
                      <div className="font-bold mt-1">—</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded">
                      Доход
                      <div className="font-bold mt-1">—</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded shadow">
                  <h3 className="font-bold mb-2">Последние действия</h3>
                  <div className="text-sm text-gray-500">Здесь будут показаны последние заказы и уведомления.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Мои товары</h2>
                <div className="flex items-center gap-2">
                  {/* Bulk Actions */}
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded flex items-center gap-2 mr-4 animate-in fade-in"
                    >
                      <Trash2 size={18} /> Удалить ({selectedIds.size})
                    </button>
                  )}

                  {/* Sort Dropdown */}
                  <div className="flex border rounded overflow-hidden mr-2">
                    <button
                      onClick={() => setSortConfig({ key: 'price', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                      className={`px-3 py-2 text-sm flex items-center gap-1 ${sortConfig.key === 'price' ? 'bg-slate-100 font-bold' : ''}`}
                    >
                      Цена <ArrowUpDown size={14} />
                    </button>
                    <button
                      onClick={() => setSortConfig({ key: 'title', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                      className={`px-3 py-2 text-sm flex items-center gap-1 border-l ${sortConfig.key === 'title' ? 'bg-slate-100 font-bold' : ''}`}
                    >
                      Название <ArrowUpDown size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => setShowAdd(true)}
                    className="px-3 py-2 bg-indigo-600 text-white rounded flex items-center gap-2"
                  >
                    <Plus /> Добавить
                  </button>
                  <button
                    onClick={() => setShowCsv(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded flex items-center gap-2"
                  >
                    <Upload size={20} /> Импорт CSV
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-20 text-center">
                  <Loader className="animate-spin mx-auto" />
                </div>
              ) : vendorProducts.length === 0 ? (
                <div className="py-12 text-center bg-white dark:bg-slate-800 rounded p-6">
                  Товары не найдены
                </div>
              ) : (
                <div className="grid gap-3">
                  <div className="flex items-center gap-2 mb-2 px-2 text-sm text-gray-500">
                    <button onClick={toggleAll} className="flex items-center gap-2 hover:text-indigo-600">
                      {selectedIds.size === vendorProducts.length && vendorProducts.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                      Выбрать все
                    </button>
                  </div>

                  {sortedProducts.map(p => (
                    <div
                      key={p.objectId}
                      className={`p-4 rounded shadow flex items-center justify-between transition-colors ${selectedIds.has(p.objectId) ? 'bg-indigo-50 border border-indigo-200' : 'bg-white dark:bg-slate-800'}`}
                    >
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleSelection(p.objectId)} className="text-gray-400 hover:text-indigo-600">
                          {selectedIds.has(p.objectId) ? <CheckSquare /> : <Square />}
                        </button>
                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                          {p.image || p.imageUrl ? (
                            <img src={p.image || p.imageUrl} className="w-full h-full object-cover" />
                          ) : (
                            <Package />
                          )}
                        </div>
                        <div>
                          <div className="font-bold">{p.title}</div>
                          <div className="text-sm text-gray-500">{p.category} • {p.price} ₽</div>
                          <div className="mt-1">
                            {p.status === 'pending' ? (
                              <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800">На проверке</span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">Активен</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                            <Truck size={12} />
                            <span>Доставка в мск: {calculateDelivery('Saint-Petersburg').daysMin}-{calculateDelivery('Saint-Petersburg').daysMax} дн.</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => alert('Редактирование пока не реализовано')}
                          className="px-2 py-1 rounded border"
                        >
                          <Edit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(p.objectId)}
                          className="px-2 py-1 rounded border text-red-600"
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}


              {showAdd && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Добавить товар</h3>
                      <button onClick={() => setShowAdd(false)} className="text-gray-500">✕</button>
                    </div>
                    <AddProductForm vendorId={user.objectId} onSuccess={(created) => {
                      try {
                        const p = created && created.objectId ? created : null;
                        if (p) {
                          const mapped: VendorProduct = {
                            objectId: p.objectId,
                            title: p.title,
                            price: p.price || 0,
                            stock: p.stock,
                            category: p.category,
                            description: p.description,
                            vendorId: p.vendorId,

                            image: p.image ? (typeof p.image === 'string' ? p.image : p.image.url || (p.image && p.image.url)) : undefined,
                            imageUrl: p.imageUrl,
                            status: p.status || 'pending'
                          };
                          setVendorProducts(prev => [mapped, ...prev]);
                        }
                      } catch (err) {
                        console.error('onSuccess mapping failed', err);
                      }
                      setShowAdd(false);
                    }} />
                    <div className="mt-4 flex justify-end">
                      <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-indigo-600 text-white rounded">Готово</button>
                    </div>
                  </div>
                </div>
              )}

              {showCsv && (
                <CsvUpload
                  vendorId={user.objectId}
                  onClose={() => setShowCsv(false)}
                  onSuccess={(count, err) => {
                    setShowCsv(false);
                    if (err) {
                      alert(`Загружено: ${count} товаров. \nОшибки: ${err}`);
                    } else {
                      alert(`Успешно загружено товаров: ${count}`);
                    }
                    window.location.reload();
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Заказы</h2>
              {ordersLoading ? (
                <div className="py-20 text-center"><Loader className="animate-spin mx-auto" /></div>
              ) : vendorOrders.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-6 rounded shadow text-center">Нет активных заказов</div>
              ) : (
                <div className="space-y-4">
                  {vendorOrders.map((order) => (
                    <div key={order.objectId} className="bg-white dark:bg-slate-800 p-4 rounded shadow border border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-bold text-lg">Заказ #{order.objectId.slice(-4)}</span>
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {translateStatus(order.status)}
                          </span>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                          <div className="font-bold text-indigo-600">{order.total} ₽</div>
                        </div>
                      </div>

                      {/* PII SECTION: MASKED DATA */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded mb-3">
                        <div>
                          <div className="text-gray-400 text-xs uppercase mb-1">Покупатель</div>
                          <div className="font-medium flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                            {maskName(order.customerName)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs uppercase mb-1">Контакты (Скрыто)</div>
                          <div className="font-mono text-xs text-gray-600">
                            {maskEmail(order.email)} <br />
                            {maskPhone(order.phone)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm border-b border-gray-100 last:border-0 py-1">
                            <span>{item.title} x {item.quantity}</span>
                            <span>{item.price * item.quantity} ₽</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded shadow">
              Настройки магазина
            </div>
          )}
        </main>
      </div >
    </div >
  );
};

export default VendorDashboard;
