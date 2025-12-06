/// <reference types="vite/client" />
import Parse from 'parse';

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ И КОНФИГУРАЦИЯ
// ============================================================================

/**
 * Проверяет, настроены ли переменные окружения для Back4App.
 * Используется для условной логики в api.ts.
 */
export const isBack4AppConfigured = !!(
  import.meta.env.VITE_BACK4APP_APP_ID && import.meta.env.VITE_BACK4APP_JS_KEY
);

export let isBack4AppReady = false;

/**
 * Инициализирует Parse SDK с App ID и JS Key.
 * Вызывается при первом использовании Back4App.
 */
export const initBack4App = (appId?: string, jsKey?: string): boolean => {
  if (isBack4AppReady) return true; // Уже инициализирован

  const APP_ID = appId || import.meta.env.VITE_BACK4APP_APP_ID;
  const JS_KEY = jsKey || import.meta.env.VITE_BACK4APP_JS_KEY;

  if (!APP_ID || !JS_KEY) {
    console.warn('[Back4App] Credentials not found. Using fallback mode.');
    return false;
  }

  try {
    // Инициализируем только без LiveQuery
    Parse.initialize(APP_ID, JS_KEY);
    Parse.serverURL = 'https://parseapi.back4app.com';
    
    // Отключаем LiveQuery чтобы избежать проблем с EventEmitter
    (Parse as any).LiveQuery = null;
    
    isBack4AppReady = true;
    console.log('[Back4App] Initialized successfully.');
    return true;
  } catch (error) {
    console.error('[Back4App] Initialization error:', error);
    console.warn('[Back4App] Falling back to mock mode.');
    isBack4AppReady = false;
    return false;
  }
};

// НЕ инициализируем при импорте - ждем явного вызова
// Это избегает ошибок если Parse не может загруститься

// ============================================================================
// ТИПЫ ДАННЫХ
// ============================================================================

export interface UserData {
  objectId: string;
  email: string;
  name: string;
  role?: 'buyer' | 'seller' | 'admin';
  phone?: string;
  avatar?: string;
  [key: string]: any;
}

export interface ProductData {
  objectId?: string;
  title: string;
  price: number;
  description: string;
  category: string;
  vendorId?: string;
  image?: string;
  rating?: number;
  reviewsCount?: number;
  [key: string]: any;
}

export interface OrderData {
  objectId?: string;
  items: any[];
  userId: string;
  vendorId?: string;
  totalPrice: number;
  status?: 'pending' | 'processing' | 'delivered' | 'cancelled';
  createdAt?: Date;
  [key: string]: any;
}

// ============================================================================
// ПОЛЬЗОВАТЕЛЬ (USER)
// ============================================================================

/**
 * Вход в систему с email и паролем.
 * 
 * @param email - Email пользователя
 * @param password - Пароль
 * @returns UserData объект с данными пользователя или null если ошибка
 * 
 * @example
 * const user = await Back4App.login('user@example.com', 'password123');
 * if (user) {
 *   console.log('Вошли как:', user.name); // { objectId: "...", email: "...", name: "..." }
 * }
 */
export const login = async (email: string, password: string): Promise<UserData | null> => {
  try {
    if (!isBack4AppReady) {
      console.warn('[Back4App] Not initialized.');
      return null;
    }

    const user = await Parse.User.logIn(email, password);
    return {
      objectId: user.id,
      email: user.get('email'),
      name: user.get('name') || email.split('@')[0],
      role: user.get('role') || 'buyer',
      phone: user.get('phone'),
      avatar: user.get('avatar'),
    };
  } catch (error) {
    console.error('[Back4App] Login error:', error);
    return null;
  }
};

/**
 * Выход из системы.
 * Очищает сессию Parse на клиенте.
 * 
 * @example
 * await Back4App.logout();
 */
export const logout = async (): Promise<void> => {
  try {
    if (!isBack4AppReady) return;
    await Parse.User.logOut();
    console.log('[Back4App] Logged out successfully.');
  } catch (error) {
    console.error('[Back4App] Logout error:', error);
  }
};

/**
 * Получает текущего залогиненного пользователя.
 * 
 * @returns UserData объект или null если никто не залогинен
 * 
 * @example
 * const currentUser = Back4App.getCurrentUserJson();
 * if (currentUser) {
 *   console.log('Текущий юзер:', currentUser.name);
 * }
 */
export const getCurrentUserJson = (): UserData | null => {
  try {
    if (!isBack4AppReady) return null;
    
    const user = Parse.User.current();
    if (!user) return null;

    return {
      objectId: user.id,
      email: user.get('email'),
      name: user.get('name') || 'Unknown',
      role: user.get('role') || 'buyer',
      phone: user.get('phone'),
      avatar: user.get('avatar'),
    };
  } catch (error) {
    console.warn('[Back4App] getCurrentUserJson error:', error);
    return null;
  }
};

/**
 * Обновляет данные текущего пользователя.
 * 
 * @param updates - Объект с полями для обновления
 * @returns Обновлённый UserData или null если ошибка
 * 
 * @example
 * const updated = await Back4App.updateCurrentUser({ name: 'New Name', phone: '+7...' });
 * if (updated) {
 *   console.log('Обновлено:', updated.name);
 * }
 */
export const updateCurrentUser = async (updates: Partial<UserData>): Promise<UserData | null> => {
  try {
    if (!isBack4AppReady) {
      console.warn('[Back4App] Not initialized.');
      return null;
    }

    const user = Parse.User.current();
    if (!user) {
      console.warn('[Back4App] No user logged in.');
      return null;
    }

    // Исключаем objectId и защищённые поля
    const { objectId, email, ...safeUpdates } = updates;

    // Применяем обновления
    Object.keys(safeUpdates).forEach((key) => {
      user.set(key, safeUpdates[key as keyof typeof safeUpdates]);
    });

    await user.save();
    console.log('[Back4App] User updated successfully.');

    return {
      objectId: user.id,
      email: user.get('email'),
      name: user.get('name'),
      role: user.get('role'),
      phone: user.get('phone'),
      avatar: user.get('avatar'),
    };
  } catch (error) {
    console.error('[Back4App] Update user error:', error);
    return null;
  }
};

// ============================================================================
// ТОВАРЫ (PRODUCT)
// ============================================================================

/**
 * Получает все товары.
 * 
 * @returns Массив ProductData объектов
 * 
 * @example
 * const products = await Back4App.getProducts();
 * console.log(`Найдено товаров: ${products.length}`);
 */
export const getProducts = async (): Promise<ProductData[]> => {
  try {
    const query = new Parse.Query('Product');
    const results = await query.find();
    return results.map((obj) => ({
      objectId: obj.id,
      title: obj.get('title'),
      price: obj.get('price'),
      description: obj.get('description'),
      category: obj.get('category'),
      vendorId: obj.get('vendorId'),
      image: obj.get('image'),
      rating: obj.get('rating'),
      reviewsCount: obj.get('reviewsCount'),
    }));
  } catch (error) {
    console.error('[Back4App] Get products error:', error);
    return [];
  }
};

/**
 * Получает товар по ID.
 * 
 * @param id - ObjectId товара
 * @returns ProductData или null если не найден
 * 
 * @example
 * const product = await Back4App.getProductById('abc123');
 * if (product) {
 *   console.log('Товар:', product.title, product.price);
 * }
 */
export const getProductById = async (id: string): Promise<ProductData | null> => {
  try {
    const query = new Parse.Query('Product');
    const result = await query.get(id);
    return {
      objectId: result.id,
      title: result.get('title'),
      price: result.get('price'),
      description: result.get('description'),
      category: result.get('category'),
      vendorId: result.get('vendorId'),
      image: result.get('image'),
      rating: result.get('rating'),
      reviewsCount: result.get('reviewsCount'),
    };
  } catch (error) {
    console.error('[Back4App] Get product by ID error:', error);
    return null;
  }
};

/**
 * Создаёт новый товар (требует аутентификацию).
 * 
 * @param product - Данные товара
 * @returns ProductData с objectId или null если ошибка
 * 
 * @example
 * const newProduct = await Back4App.createProduct({
 *   title: 'Ноутбук',
 *   price: 50000,
 *   description: 'Мощный ноутбук',
 *   category: 'electronics',
 *   vendorId: 'vendor123'
 * });
 */
export const createProduct = async (product: ProductData): Promise<ProductData | null> => {
  try {
    const ProductClass = Parse.Object.extend('Product');
    const obj = new ProductClass();
    
    Object.keys(product).forEach((key) => {
      if (key !== 'objectId') {
        obj.set(key, product[key as keyof ProductData]);
      }
    });

    await obj.save();
    console.log('[Back4App] Product created:', obj.id);

    return {
      objectId: obj.id,
      title: obj.get('title'),
      price: obj.get('price'),
      description: obj.get('description'),
      category: obj.get('category'),
      vendorId: obj.get('vendorId'),
      image: obj.get('image'),
      rating: obj.get('rating'),
      reviewsCount: obj.get('reviewsCount'),
    };
  } catch (error) {
    console.error('[Back4App] Create product error:', error);
    return null;
  }
};

/**
 * Обновляет товар по ID (требует аутентификацию).
 * 
 * @param objectId - ID товара
 * @param updates - Поля для обновления
 * @returns Обновлённый ProductData или null если ошибка
 * 
 * @example
 * const updated = await Back4App.updateProduct('abc123', { price: 45000 });
 */
export const updateProduct = async (objectId: string, updates: Partial<ProductData>): Promise<ProductData | null> => {
  try {
    const query = new Parse.Query('Product');
    const obj = await query.get(objectId);

    Object.keys(updates).forEach((key) => {
      if (key !== 'objectId') {
        obj.set(key, updates[key as keyof ProductData]);
      }
    });

    await obj.save();
    console.log('[Back4App] Product updated:', objectId);

    return {
      objectId: obj.id,
      title: obj.get('title'),
      price: obj.get('price'),
      description: obj.get('description'),
      category: obj.get('category'),
      vendorId: obj.get('vendorId'),
      image: obj.get('image'),
      rating: obj.get('rating'),
      reviewsCount: obj.get('reviewsCount'),
    };
  } catch (error) {
    console.error('[Back4App] Update product error:', error);
    return null;
  }
};

/**
 * Удаляет товар (требует аутентификацию).
 * 
 * @param objectId - ID товара
 * @returns true если успешно, false если ошибка
 * 
 * @example
 * const success = await Back4App.deleteProduct('abc123');
 */
export const deleteProduct = async (objectId: string): Promise<boolean> => {
  try {
    const query = new Parse.Query('Product');
    const obj = await query.get(objectId);
    await obj.destroy();
    console.log('[Back4App] Product deleted:', objectId);
    return true;
  } catch (error) {
    console.error('[Back4App] Delete product error:', error);
    return false;
  }
};

/**
 * Запрашивает товары с фильтрами.
 * 
 * @param filters - Объект с условиями поиска { category?, minPrice?, maxPrice?, ... }
 * @returns Массив ProductData
 * 
 * @example
 * const filtered = await Back4App.queryProducts({
 *   category: 'electronics',
 *   minPrice: 10000,
 *   maxPrice: 100000
 * });
 */
export const queryProducts = async (filters: { [key: string]: any }): Promise<ProductData[]> => {
  try {
    const query = new Parse.Query('Product');

    // Фильтры по цене
    if (filters.minPrice !== undefined) query.greaterThanOrEqualTo('price', filters.minPrice);
    if (filters.maxPrice !== undefined) query.lessThanOrEqualTo('price', filters.maxPrice);

    // Фильтр по категории
    if (filters.category) query.equalTo('category', filters.category);

    // Фильтр по prodavtorId
    if (filters.vendorId) query.equalTo('vendorId', filters.vendorId);

    // Фильтр по рейтингу
    if (filters.minRating !== undefined) query.greaterThanOrEqualTo('rating', filters.minRating);

    const results = await query.find();
    return results.map((obj) => ({
      objectId: obj.id,
      title: obj.get('title'),
      price: obj.get('price'),
      description: obj.get('description'),
      category: obj.get('category'),
      vendorId: obj.get('vendorId'),
      image: obj.get('image'),
      rating: obj.get('rating'),
      reviewsCount: obj.get('reviewsCount'),
    }));
  } catch (error) {
    console.error('[Back4App] Query products error:', error);
    return [];
  }
};

// ============================================================================
// ЗАКАЗЫ (ORDER)
// ============================================================================

/**
 * Создаёт новый заказ (требует аутентификацию).
 * 
 * @param order - Данные заказа
 * @returns OrderData с objectId или null если ошибка
 * 
 * @example
 * const newOrder = await Back4App.createOrder({
 *   items: [{ id: 'prod1', qty: 2, price: 5000 }],
 *   userId: 'user123',
 *   totalPrice: 10000,
 *   status: 'pending'
 * });
 */
export const createOrder = async (order: OrderData): Promise<OrderData | null> => {
  try {
    const OrderClass = Parse.Object.extend('Order');
    const obj = new OrderClass();

    Object.keys(order).forEach((key) => {
      if (key !== 'objectId') {
        obj.set(key, order[key as keyof OrderData]);
      }
    });

    await obj.save();
    console.log('[Back4App] Order created:', obj.id);

    return {
      objectId: obj.id,
      items: obj.get('items'),
      userId: obj.get('userId'),
      vendorId: obj.get('vendorId'),
      totalPrice: obj.get('totalPrice'),
      status: obj.get('status') || 'pending',
      createdAt: obj.createdAt,
    };
  } catch (error) {
    console.error('[Back4App] Create order error:', error);
    return null;
  }
};

/**
 * Получает заказы (опционально с фильтром по пользователю).
 * 
 * @param queryParams - { userId?, status?, limit?, skip? }
 * @returns Массив OrderData
 * 
 * @example
 * const myOrders = await Back4App.getOrders({ userId: 'user123' });
 * const allOrders = await Back4App.getOrders({ status: 'delivered', limit: 10 });
 */
export const getOrders = async (queryParams?: { [key: string]: any }): Promise<OrderData[]> => {
  try {
    const query = new Parse.Query('Order');

    if (queryParams?.userId) query.equalTo('userId', queryParams.userId);
    if (queryParams?.status) query.equalTo('status', queryParams.status);
    if (queryParams?.vendorId) query.equalTo('vendorId', queryParams.vendorId);

    query.limit(queryParams?.limit || 1000);
    query.skip(queryParams?.skip || 0);
    query.descending('createdAt');

    const results = await query.find();
    return results.map((obj) => ({
      objectId: obj.id,
      items: obj.get('items'),
      userId: obj.get('userId'),
      vendorId: obj.get('vendorId'),
      totalPrice: obj.get('totalPrice'),
      status: obj.get('status') || 'pending',
      createdAt: obj.createdAt,
    }));
  } catch (error) {
    console.error('[Back4App] Get orders error:', error);
    return [];
  }
};

/**
 * Получает заказ по ID.
 * 
 * @param id - ObjectId заказа
 * @returns OrderData или null если не найден
 */
export const getOrderById = async (id: string): Promise<OrderData | null> => {
  try {
    const query = new Parse.Query('Order');
    const result = await query.get(id);
    return {
      objectId: result.id,
      items: result.get('items'),
      userId: result.get('userId'),
      vendorId: result.get('vendorId'),
      totalPrice: result.get('totalPrice'),
      status: result.get('status') || 'pending',
      createdAt: result.createdAt,
    };
  } catch (error) {
    console.error('[Back4App] Get order by ID error:', error);
    return null;
  }
};

/**
 * Обновляет заказ (требует аутентификацию).
 * 
 * @param id - ID заказа
 * @param updates - Поля для обновления
 * @returns Обновлённый OrderData или null если ошибка
 * 
 * @example
 * const updated = await Back4App.updateOrder('order123', { status: 'delivered' });
 */
export const updateOrder = async (id: string, updates: Partial<OrderData>): Promise<OrderData | null> => {
  try {
    const query = new Parse.Query('Order');
    const obj = await query.get(id);

    Object.keys(updates).forEach((key) => {
      if (key !== 'objectId') {
        obj.set(key, updates[key as keyof OrderData]);
      }
    });

    await obj.save();
    console.log('[Back4App] Order updated:', id);

    return {
      objectId: obj.id,
      items: obj.get('items'),
      userId: obj.get('userId'),
      vendorId: obj.get('vendorId'),
      totalPrice: obj.get('totalPrice'),
      status: obj.get('status') || 'pending',
      createdAt: obj.createdAt,
    };
  } catch (error) {
    console.error('[Back4App] Update order error:', error);
    return null;
  }
};

/**
 * Удаляет заказ (требует аутентификацию).
 * 
 * @param id - ID заказа
 * @returns true если успешно, false если ошибка
 */
export const deleteOrder = async (id: string): Promise<boolean> => {
  try {
    const query = new Parse.Query('Order');
    const obj = await query.get(id);
    await obj.destroy();
    console.log('[Back4App] Order deleted:', id);
    return true;
  } catch (error) {
    console.error('[Back4App] Delete order error:', error);
    return false;
  }
};

// ============================================================================
// ЭКСПОРТ ОБЪЕКТА Back4App ДЛЯ УДОБСТВА
// ============================================================================

export const Back4App = {
  // User
  login,
  logout,
  getCurrentUserJson,
  updateCurrentUser,
  // Product
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  queryProducts,
  // Order
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};

export default Back4App;
