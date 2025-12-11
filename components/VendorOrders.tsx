/**
 * Управление заказами вендора
 * Просмотр, фильтрация и изменение статусов заказов через Parse SDK
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader, Clock, CheckCircle, Truck, MapPin, User, DollarSign, Eye, Filter, ShoppingCart, X } from 'lucide-react';
import * as parseSDK from '../services/parseSDK';

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface Order {
  objectId: string;
  orderId: string;
  vendorId: string;
  customerId: string;
  products: OrderItem[];
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  shippingAddress: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VendorOrdersProps {
  vendorId: string;
}

const VendorOrders: React.FC<VendorOrdersProps> = ({ vendorId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Загрузка заказов при первом рендере
  useEffect(() => {
    loadOrders();
  }, [vendorId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await parseSDK.getOrdersByVendor(vendorId);

      const ordersData = items.map((item: any) => ({
        objectId: item.id,
        orderId: item.get('orderId'),
        vendorId: item.get('vendorId'),
        customerId: item.get('customerId'),
        products: item.get('products') || [],
        status: item.get('status'),
        totalAmount: item.get('totalAmount'),
        shippingAddress: item.get('shippingAddress'),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      setOrders(ordersData);
    } catch (err) {
      console.error('Ошибка загрузки заказов:', err);
      setError('Не удалось загрузить заказы. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  // Обновление статуса заказа
  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await parseSDK.updateOrderStatus(orderId, newStatus);

      setOrders(prev =>
        prev.map(order =>
          order.objectId === orderId ? { ...order, status: newStatus } : order
        )
      );

      if (selectedOrder?.objectId === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Ошибка обновления статуса:', err);
      alert('Ошибка обновления статуса заказа');
    }
  };

  // Фильтрация и сортировка заказов
  const filteredOrders = orders
    .filter(order => statusFilter === 'all' || order.status === statusFilter)
    .sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

  // Статус информация
  const getStatusInfo = (status: Order['status']) => {
    const statusMap = {
      pending: { label: 'Ожидание', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20', icon: Clock },
      confirmed: { label: 'Подтверждено', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', icon: CheckCircle },
      shipped: { label: 'Отправлено', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', icon: Truck },
      delivered: { label: 'Доставлено', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle },
      cancelled: { label: 'Отменено', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', icon: AlertCircle },
    };
    return statusMap[status];
  };

  // Следующие возможные статусы
  const getNextStatuses = (currentStatus: Order['status']): Order['status'][] => {
    const transitions: Record<Order['status'], Order['status'][]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };
    return transitions[currentStatus] || [];
  };

  return (
    <div className="space-y-6">
      {/* Ошибка */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">Ошибка</h3>
            <p className="text-red-800 dark:text-red-200 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Заголовок и фильтры */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Управление заказами</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Всего заказов: {filteredOrders.length}</p>
        </div>

        {/* Фильтры */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Фильтр по статусу
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'Все' },
                { value: 'pending', label: 'Ожидание' },
                { value: 'confirmed', label: 'Подтверждены' },
                { value: 'shipped', label: 'Отправлены' },
                { value: 'delivered', label: 'Доставлены' },
              ].map(status => (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(status.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Сортировка
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">Новые сначала</option>
              <option value="oldest">Старые сначала</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список заказов */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center">
          <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Заказы не найдены</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {statusFilter !== 'all' ? 'Нет заказов с выбранным статусом' : 'У вас нет заказов'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={order.objectId} className="bg-white dark:bg-slate-800 rounded-lg p-6 border dark:border-slate-700 hover:shadow-md transition-shadow">
                {/* Заголовок заказа */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Заказ #{order.orderId}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {order.createdAt ? parseSDK.formatDate(order.createdAt) : 'Дата неизвестна'}
                    </p>
                  </div>

                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${statusInfo.bgColor}`}>
                    <StatusIcon size={16} className={statusInfo.color} />
                    <span className={`font-medium text-sm ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Информация о заказе */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    <User size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Покупатель</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customerId}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Адрес доставки</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {order.shippingAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Сумма</p>
                      <p className="text-sm font-bold text-indigo-600">
                        {parseSDK.formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Товары */}
                {order.products && order.products.length > 0 && (
                  <div className="mb-4 pb-4 border-b dark:border-slate-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Товары:</p>
                    <div className="space-y-1 text-sm">
                      {order.products.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Товар ID: {item.productId} × {item.quantity}</span>
                          <span>{parseSDK.formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Кнопки действия */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <Eye size={16} />
                    Просмотр деталей
                  </button>

                  {getNextStatuses(order.status).length > 0 && (
                    <div className="flex gap-2 flex-1">
                      {getNextStatuses(order.status).map(nextStatus => {
                        const nextStatusInfo = getStatusInfo(nextStatus);
                        return (
                          <button
                            key={nextStatus}
                            onClick={() => handleUpdateStatus(order.objectId, nextStatus)}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors font-medium text-sm"
                          >
                            → {nextStatusInfo.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модаль просмотра деталей заказа */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b dark:border-slate-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Детали заказа #{selectedOrder.orderId}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Информация о заказе */}
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">Информация о заказе</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ID заказа</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Статус</p>
                    <div className={`inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(selectedOrder.status).bgColor} ${getStatusInfo(selectedOrder.status).color}`}>
                      {getStatusInfo(selectedOrder.status).label}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Дата заказа</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedOrder.createdAt ? parseSDK.formatDate(selectedOrder.createdAt) : 'Неизвестна'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Сумма</p>
                    <p className="font-bold text-indigo-600">{parseSDK.formatCurrency(selectedOrder.totalAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Информация о клиенте */}
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">Информация о клиенте</h4>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">ID клиента: </span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.customerId}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Адрес доставки: </span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.shippingAddress}</span>
                  </p>
                </div>
              </div>

              {/* Товары */}
              {selectedOrder.products && selectedOrder.products.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3">Товары в заказе</h4>
                  <div className="space-y-2">
                    {selectedOrder.products.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 rounded">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Товар #{item.productId}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Количество: {item.quantity}
                          </p>
                        </div>
                        <p className="font-bold text-indigo-600">
                          {parseSDK.formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Смена статуса */}
              {getNextStatuses(selectedOrder.status).length > 0 && (
                <div className="border-t dark:border-slate-800 pt-6">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3">Изменить статус</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {getNextStatuses(selectedOrder.status).map(nextStatus => (
                      <button
                        key={nextStatus}
                        onClick={() => {
                          handleUpdateStatus(selectedOrder.objectId, nextStatus);
                          setSelectedOrder(null);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors font-medium text-sm"
                      >
                        {getStatusInfo(nextStatus).label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t dark:border-slate-800 p-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrders;
