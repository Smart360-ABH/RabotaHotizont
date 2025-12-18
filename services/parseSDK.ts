/**
 * Parse SDK Wrapper for Back4App
 * Полная реализация CRUD операций для классов Product, Order, Transaction
 * с поддержкой загрузки файлов и работы с сессиями пользователя
 */

import Parse from 'parse';

// ============ ИНИЦИАЛИЗАЦИЯ ============

export function initializeParse(appId?: string, jsKey?: string) {
  const APP_ID = appId || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PARSE_APP_ID) || (process.env as any).REACT_APP_PARSE_APP_ID || '';
  const JS_KEY = jsKey || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PARSE_JS_KEY) || (process.env as any).REACT_APP_PARSE_JS_KEY || '';

  if (!APP_ID || !JS_KEY) {
    console.warn('⚠️ Parse не инициализирован: не заданы VITE_PARSE_APP_ID или VITE_PARSE_JS_KEY');
    return;
  }

  Parse.initialize(APP_ID, JS_KEY);
  Parse.serverURL = 'https://parseapi.back4app.com';
  console.info('✅ Parse инициализирован');
}

// ============ АУТЕНТИФИКАЦИЯ ============

export async function loginUser(username: string, password: string) {
  try {
    const user = await Parse.User.logIn(username, password);
    console.log('✅ Пользователь вошел:', user.get('username'));
    return user;
  } catch (error) {
    console.error('❌ Ошибка входа:', error);
    throw error;
  }
}

export async function registerUser(username: string, email: string, password: string, role: 'vendor' | 'customer' = 'customer') {
  try {
    const user = new Parse.User();
    user.set('username', username);
    user.set('email', email);
    user.set('password', password);
    user.set('role', role);
    user.set('name', username);
    user.set('vendorName', role === 'vendor' ? username : null);
    
    await user.save();
    console.log('✅ Пользователь зарегистрирован:', username);
    return user;
  } catch (error) {
    console.error('❌ Ошибка регистрации:', error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await Parse.User.logOut();
    console.log('✅ Пользователь вышел');
  } catch (error) {
    console.error('❌ Ошибка выхода:', error);
    throw error;
  }
}

export function getCurrentUser(): Parse.User | null {
  return Parse.User.current();
}

export async function updateUserProfile(userId: string, fields: Record<string, any>) {
  try {
    const UserClass = Parse.Object.extend('_User');
    const query = new Parse.Query(UserClass);
    const userObj = await query.get(userId);
    Object.entries(fields).forEach(([key, value]) => {
      userObj.set(key, value);
    });
    await userObj.save();
    console.log('✅ Профиль пользователя обновлен');
    return userObj;
  } catch (error) {
    console.error('❌ Ошибка обновления профиля:', error);
    throw error;
  }
}

// ============ РАБОТА С ТОВАРАМИ (PRODUCT) ============

export interface IProduct {
  objectId?: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  vendorId: string;
  image?: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function createProduct(vendorId: string, productData: Omit<IProduct, 'objectId'>) {
  try {
    const Product = Parse.Object.extend('Product');
    const product = new Product();
    
    product.set('title', productData.title);
    product.set('description', productData.description);
    product.set('price', productData.price);
    product.set('stock', productData.stock);
    product.set('category', productData.category);
    product.set('vendorId', vendorId);
    product.set('image', productData.image || null);
    product.set('images', productData.images || []);
    product.set('rating', 0);
    product.set('reviews', 0);
    
    await product.save();
    console.log('✅ Товар создан:', product.id);
    return product;
  } catch (error) {
    console.error('❌ Ошибка создания товара:', error);
    throw error;
  }
}

export async function getProductsByVendor(vendorId: string) {
  try {
    const Product = Parse.Object.extend('Product');
    const query = new Parse.Query(Product);
    query.equalTo('vendorId', vendorId);
    query.descending('createdAt');
    
    const products = await query.find();
    console.log(`✅ Загружено ${products.length} товаров для вендора`);
    return products;
  } catch (error) {
    console.error('❌ Ошибка загрузки товаров:', error);
    throw error;
  }
}

export async function getProductById(productId: string) {
  try {
    const Product = Parse.Object.extend('Product');
    const query = new Parse.Query(Product);
    const product = await query.get(productId);
    console.log('✅ Товар загружен:', product.id);
    return product;
  } catch (error) {
    console.error('❌ Ошибка загрузки товара:', error);
    throw error;
  }
}

export async function updateProduct(productId: string, fields: Record<string, any>) {
  try {
    const Product = Parse.Object.extend('Product');
    const query = new Parse.Query(Product);
    const product = await query.get(productId);
    
    Object.entries(fields).forEach(([key, value]) => {
      product.set(key, value);
    });
    
    await product.save();
    console.log('✅ Товар обновлен:', productId);
    return product;
  } catch (error) {
    console.error('❌ Ошибка обновления товара:', error);
    throw error;
  }
}

export async function deleteProduct(productId: string) {
  try {
    const Product = Parse.Object.extend('Product');
    const query = new Parse.Query(Product);
    const product = await query.get(productId);
    
    await product.destroy();
    console.log('✅ Товар удален:', productId);
  } catch (error) {
    console.error('❌ Ошибка удаления товара:', error);
    throw error;
  }
}

// ============ ЗАГРУЗКА ФАЙЛОВ ============

export async function uploadProductImage(file: File): Promise<string> {
  try {
    const parseFile = new Parse.File(file.name, file);
    await parseFile.save();
    const url = parseFile.url();
    console.log('✅ Изображение загружено:', url);
    return url;
  } catch (error) {
    console.error('❌ Ошибка загрузки изображения:', error);
    throw error;
  }
}

export async function uploadMultipleImages(files: File[]): Promise<string[]> {
  try {
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadProductImage(file);
      urls.push(url);
    }
    console.log(`✅ Загружено ${urls.length} изображений`);
    return urls;
  } catch (error) {
    console.error('❌ Ошибка загрузки изображений:', error);
    throw error;
  }
}

// ============ РАБОТА С ЗАКАЗАМИ (ORDER) ============

export interface IOrder {
  objectId?: string;
  orderId: string;
  vendorId: string;
  customerId: string;
  products: Array<{ productId: string; quantity: number; price: number }>;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  shippingAddress: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getOrdersByVendor(vendorId: string) {
  try {
    const Order = Parse.Object.extend('Order');
    const query = new Parse.Query(Order);
    query.equalTo('vendorId', vendorId);
    query.descending('createdAt');
    
    const orders = await query.find();
    console.log(`✅ Загружено ${orders.length} заказов для вендора`);
    return orders;
  } catch (error) {
    console.error('❌ Ошибка загрузки заказов:', error);
    throw error;
  }
}

export async function getOrderById(orderId: string) {
  try {
    const Order = Parse.Object.extend('Order');
    const query = new Parse.Query(Order);
    const order = await query.get(orderId);
    console.log('✅ Заказ загружен:', order.id);
    return order;
  } catch (error) {
    console.error('❌ Ошибка загрузки заказа:', error);
    throw error;
  }
}

export async function updateOrderStatus(orderId: string, status: IOrder['status']) {
  try {
    const Order = Parse.Object.extend('Order');
    const query = new Parse.Query(Order);
    const order = await query.get(orderId);
    
    order.set('status', status);
    await order.save();
    console.log(`✅ Статус заказа обновлен: ${status}`);
    return order;
  } catch (error) {
    console.error('❌ Ошибка обновления статуса заказа:', error);
    throw error;
  }
}

export async function getOrderStats(vendorId: string) {
  try {
    const Order = Parse.Object.extend('Order');
    const query = new Parse.Query(Order);
    query.equalTo('vendorId', vendorId);
    
    const total = await query.count();
    
    // Статистика по статусам
    const pendingQuery = new Parse.Query(Order);
    pendingQuery.equalTo('vendorId', vendorId);
    pendingQuery.equalTo('status', 'pending');
    const pending = await pendingQuery.count();
    
    const shippedQuery = new Parse.Query(Order);
    shippedQuery.equalTo('vendorId', vendorId);
    shippedQuery.equalTo('status', 'shipped');
    const shipped = await shippedQuery.count();
    
    const deliveredQuery = new Parse.Query(Order);
    deliveredQuery.equalTo('vendorId', vendorId);
    deliveredQuery.equalTo('status', 'delivered');
    const delivered = await deliveredQuery.count();
    
    console.log('✅ Статистика заказов загружена');
    return { total, pending, shipped, delivered };
  } catch (error) {
    console.error('❌ Ошибка загрузки статистики заказов:', error);
    throw error;
  }
}

// ============ РАБОТА С ТРАНЗАКЦИЯМИ (TRANSACTION) ============

export interface ITransaction {
  objectId?: string;
  vendorId: string;
  orderId: string;
  amount: number;
  commission: number;
  netIncome: number;
  type: 'sale' | 'refund' | 'withdrawal';
  status: 'completed' | 'pending' | 'failed';
  createdAt?: Date;
}

export async function createTransaction(transactionData: Omit<ITransaction, 'objectId'>) {
  try {
    const Transaction = Parse.Object.extend('Transaction');
    const transaction = new Transaction();
    
    transaction.set('vendorId', transactionData.vendorId);
    transaction.set('orderId', transactionData.orderId);
    transaction.set('amount', transactionData.amount);
    transaction.set('commission', transactionData.commission);
    transaction.set('netIncome', transactionData.netIncome);
    transaction.set('type', transactionData.type);
    transaction.set('status', transactionData.status);
    
    await transaction.save();
    console.log('✅ Транзакция создана:', transaction.id);
    return transaction;
  } catch (error) {
    console.error('❌ Ошибка создания транзакции:', error);
    throw error;
  }
}

export async function getTransactionsByVendor(vendorId: string) {
  try {
    const Transaction = Parse.Object.extend('Transaction');
    const query = new Parse.Query(Transaction);
    query.equalTo('vendorId', vendorId);
    query.descending('createdAt');
    
    const transactions = await query.find();
    console.log(`✅ Загружено ${transactions.length} транзакций`);
    return transactions;
  } catch (error) {
    console.error('❌ Ошибка загрузки транзакций:', error);
    throw error;
  }
}

export async function getFinancialReport(vendorId: string) {
  try {
    const Transaction = Parse.Object.extend('Transaction');
    const query = new Parse.Query(Transaction);
    query.equalTo('vendorId', vendorId);
    
    const transactions = await query.find();
    
    let totalIncome = 0;
    let totalCommission = 0;
    let totalRefunds = 0;
    
    transactions.forEach(t => {
      const type = t.get('type');
      const amount = t.get('amount') || 0;
      const commission = t.get('commission') || 0;
      
      if (type === 'sale') {
        totalIncome += amount;
        totalCommission += commission;
      } else if (type === 'refund') {
        totalRefunds += amount;
      }
    });
    
    const netIncome = totalIncome - totalCommission - totalRefunds;
    
    console.log('✅ Финансовый отчет загружен');
    return {
      totalIncome,
      totalCommission,
      totalRefunds,
      netIncome,
      transactionCount: transactions.length
    };
  } catch (error) {
    console.error('❌ Ошибка загрузки финансового отчета:', error);
    throw error;
  }
}

// ============ ОБЛАЧНЫЕ ФУНКЦИИ ============

export async function callVendorReport(vendorId: string) {
  try {
    const result = await Parse.Cloud.run('vendorReport', { vendorId });
    console.log('✅ Отчет от облачной функции:', result);
    return result;
  } catch (error) {
    console.error('❌ Ошибка вызова облачной функции:', error);
    // Возвращаем пустой отчет, если функция недоступна
    return { totalIncome: 0, totalOrders: 0, totalCommission: 0 };
  }
}

// ============ УТИЛИТЫ ============

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB'
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

export default {
  initializeParse,
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  createProduct,
  getProductsByVendor,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  uploadMultipleImages,
  getOrdersByVendor,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
  createTransaction,
  getTransactionsByVendor,
  getFinancialReport,
  callVendorReport,
  formatCurrency,
  formatDate
};
