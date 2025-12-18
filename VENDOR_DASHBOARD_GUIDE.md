# Полное руководство: Личный кабинет Вендора (Продавца)

## 📋 Оглавление
1. [Архитектура системы](#архитектура-системы)
2. [Установка и инициализация](#установка-и-инициализация)
3. [API Reference](#api-reference)
4. [Примеры кода](#примеры-кода)
5. [Интеграция с Back4App](#интеграция-с-back4app)
6. [Структура базы данных](#структура-базы-данных)

---

## Архитектура системы

### Слои приложения

```
┌─────────────────────────────────────────┐
│         UI Components (React)            │
│  ┌──────────────┬──────┬──────┬────────┐│
│  │VendorDashbrd │Orders│Product│Finance││
│  │Settings      │      │      │       ││
│  └──────────────┴──────┴──────┴────────┘│
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│      Parse SDK Wrapper (parseSDK.ts)    │
│  ┌──────────┬──────────┬────────────┐  │
│  │Auth      │Products  │Transactions│  │
│  │Orders    │Finance   │File Upload │  │
│  └──────────┴──────────┴────────────┘  │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│        Parse SDK (npm parse)            │
│     REST API to Back4App Server         │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│    Back4App (Parse Server as Backend)   │
│  ┌──────────────────────────────────┐  │
│  │ Classes: User, Product, Order    │  │
│  │ Transaction, File Storage        │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Компоненты React

| Компонент | Функция |
|-----------|---------|
| **VendorDashboard.tsx** | Главная панель с навигацией и метриками |
| **VendorProducts.tsx** | CRUD операции с товарами |
| **VendorOrders.tsx** | Управление заказами, смена статусов |
| **VendorFinance.tsx** | Финансовая аналитика и отчеты |
| **VendorSettings.tsx** | Профиль и настройки вендора |
| **VendorAuth.tsx** | Вход/регистрация вендора |
| **parseSDK.ts** | Wrapper для всех операций с Parse |

---

## Установка и инициализация

### 1. Переменные окружения

Создайте файл `.env.local`:

```
VITE_PARSE_APP_ID=your_app_id_here
VITE_PARSE_JS_KEY=your_js_key_here
VITE_PARSE_REST_KEY=your_rest_key_here
```

Получите ключи в Back4App Dashboard:
1. Перейдите на [back4app.com](https://www.back4app.com)
2. Выберите ваше приложение
3. Перейдите в **App Settings → Security Keys**

### 2. Инициализация Parse в приложении

```tsx
// В main.tsx или App.tsx
import * as parseSDK from './services/parseSDK';

// Инициализируем Parse при загрузке приложения
parseSDK.initializeParse();
```

### 3. Проверка подключения

```tsx
// В компоненте или консоли браузера
const currentUser = parseSDK.getCurrentUser();
console.log('Текущий пользователь:', currentUser);
```

---

## API Reference

### Аутентификация

#### `loginUser(username, password)`
Вход в систему по имени пользователя и пароли.

```typescript
try {
  const user = await parseSDK.loginUser('vendor_username', 'password123');
  console.log('Вошли как:', user.get('username'));
} catch (error) {
  console.error('Ошибка входа:', error.message);
}
```

#### `registerUser(username, email, password, role?)`
Регистрация нового пользователя.

```typescript
const user = await parseSDK.registerUser(
  'new_vendor',
  'vendor@example.com',
  'secure_password',
  'vendor'  // role: 'vendor' | 'customer'
);
```

#### `logoutUser()`
Выход из системы.

```typescript
await parseSDK.logoutUser();
```

#### `getCurrentUser()`
Получить текущего пользователя.

```typescript
const user = parseSDK.getCurrentUser();
if (user) {
  console.log('ID пользователя:', user.id);
  console.log('Имя:', user.get('username'));
}
```

---

### Работа с товарами (Product)

#### `createProduct(vendorId, productData)`
Создание нового товара.

```typescript
const product = await parseSDK.createProduct(
  'vendor_id_123',
  {
    title: 'Смартфон Samsung Galaxy S24',
    description: 'Флагманский смартфон с экраном 6.2"',
    price: 89999,
    stock: 50,
    category: 'electronics',
    image: 'https://example.com/image.jpg',
    vendorId: 'vendor_id_123',
  }
);

console.log('Товар создан с ID:', product.id);
```

#### `getProductsByVendor(vendorId)`
Получить все товары вендора.

```typescript
const products = await parseSDK.getProductsByVendor('vendor_id_123');

products.forEach(product => {
  console.log(`${product.get('title')} - ${product.get('price')} ₽`);
});
```

#### `updateProduct(productId, fields)`
Обновить товар.

```typescript
const updatedProduct = await parseSDK.updateProduct(
  'product_id_456',
  {
    price: 79999,
    stock: 45,
    description: 'Обновленное описание'
  }
);
```

#### `deleteProduct(productId)`
Удалить товар.

```typescript
await parseSDK.deleteProduct('product_id_456');
```

---

### Загрузка файлов

#### `uploadProductImage(file)`
Загрузить изображение товара.

```typescript
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
if (fileInput.files?.[0]) {
  const imageUrl = await parseSDK.uploadProductImage(fileInput.files[0]);
  console.log('Изображение загружено:', imageUrl);
}
```

#### `uploadMultipleImages(files)`
Загрузить несколько изображений.

```typescript
const images = Array.from(fileInput.files || []);
const imageUrls = await parseSDK.uploadMultipleImages(images);
console.log('Загружено изображений:', imageUrls.length);
```

---

### Работа с заказами (Order)

#### `getOrdersByVendor(vendorId)`
Получить заказы вендора.

```typescript
const orders = await parseSDK.getOrdersByVendor('vendor_id_123');

orders.forEach(order => {
  console.log(`Заказ ${order.get('orderId')} - Статус: ${order.get('status')}`);
});
```

#### `updateOrderStatus(orderId, status)`
Изменить статус заказа.

```typescript
// Возможные статусы: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
await parseSDK.updateOrderStatus(
  'order_id_789',
  'shipped'
);
```

#### `getOrderStats(vendorId)`
Получить статистику по заказам.

```typescript
const stats = await parseSDK.getOrderStats('vendor_id_123');
console.log('Ожидающих:', stats.pending);
console.log('Отправлено:', stats.shipped);
console.log('Доставлено:', stats.delivered);
```

---

### Финансы и транзакции

#### `getFinancialReport(vendorId)`
Получить финансовый отчет.

```typescript
const report = await parseSDK.getFinancialReport('vendor_id_123');

console.log('Валовый доход:', report.totalIncome);
console.log('Комиссии:', report.totalCommission);
console.log('Чистый доход:', report.netIncome);
console.log('Количество транзакций:', report.transactionCount);
```

#### `getTransactionsByVendor(vendorId)`
Получить историю транзакций.

```typescript
const transactions = await parseSDK.getTransactionsByVendor('vendor_id_123');

transactions.forEach(tx => {
  console.log(`
    Тип: ${tx.get('type')}
    Сумма: ${tx.get('amount')} ₽
    Комиссия: ${tx.get('commission')} ₽
    Статус: ${tx.get('status')}
  `);
});
```

#### `createTransaction(transactionData)`
Создать транзакцию.

```typescript
const transaction = await parseSDK.createTransaction({
  vendorId: 'vendor_id_123',
  orderId: 'order_id_789',
  amount: 5000,
  commission: 500,
  netIncome: 4500,
  type: 'sale',
  status: 'completed',
});
```

---

### Утилиты

#### `formatCurrency(amount)`
Форматировать сумму в рубли.

```typescript
const formatted = parseSDK.formatCurrency(5000);
console.log(formatted); // "5 000,00 ₽"
```

#### `formatDate(date)`
Форматировать дату по-русски.

```typescript
const date = new Date();
console.log(parseSDK.formatDate(date)); // "1 декабря 2025 г., 14:30"
```

---

## Примеры кода

### Пример 1: Полный цикл создания товара с изображением

```typescript
// 1. Получаем ID текущего вендора
const currentUser = parseSDK.getCurrentUser();
const vendorId = currentUser?.id;

if (!vendorId) {
  console.error('Пользователь не авторизован');
  return;
}

// 2. Загружаем изображение
const imageFile = new File([imageBlob], 'product-image.jpg', { type: 'image/jpeg' });
const imageUrl = await parseSDK.uploadProductImage(imageFile);

// 3. Создаем товар
const newProduct = await parseSDK.createProduct(vendorId, {
  title: 'Новый товар',
  description: 'Описание товара',
  price: 1000,
  stock: 100,
  category: 'electronics',
  image: imageUrl,
  vendorId: vendorId,
});

console.log('✅ Товар создан с ID:', newProduct.id);
```

### Пример 2: Обновление статуса заказа с логированием

```typescript
async function processOrder(orderId: string, newStatus: string) {
  try {
    console.log(`📦 Обновляем заказ ${orderId} на статус "${newStatus}"...`);
    
    await parseSDK.updateOrderStatus(orderId, newStatus as any);
    
    const order = await parseSDK.getOrderById(orderId);
    console.log(`✅ Заказ успешно обновлен`);
    console.log(`📊 Новые данные:`, {
      id: orderId,
      status: order?.get('status'),
      totalAmount: order?.get('totalAmount'),
      updatedAt: order?.updatedAt,
    });
  } catch (error) {
    console.error(`❌ Ошибка при обновлении заказа:`, error);
    throw error;
  }
}

// Использование
await processOrder('order_123', 'shipped');
```

### Пример 3: Вывод финансовой аналитики

```typescript
async function displayFinancialDashboard(vendorId: string) {
  // Получаем отчет
  const report = await parseSDK.getFinancialReport(vendorId);
  
  // Вычисляем процент комиссии
  const commissionPercentage = report.totalIncome > 0 
    ? ((report.totalCommission / report.totalIncome) * 100).toFixed(2)
    : '0.00';
  
  // Форматируем и выводим
  console.log(`
  💰 ФИНАНСОВЫЙ ОТЧЕТ
  ${'='.repeat(40)}
  Валовый доход:        ${parseSDK.formatCurrency(report.totalIncome)}
  Комиссии (${commissionPercentage}%):   ${parseSDK.formatCurrency(report.totalCommission)}
  Возвраты:             ${parseSDK.formatCurrency(report.totalRefunds)}
  ─────────────────────────────────────
  Чистый доход:         ${parseSDK.formatCurrency(report.netIncome)}
  Количество сделок:    ${report.transactionCount}
  `);
}

// Использование
await displayFinancialDashboard('vendor_id_123');
```

---

## Интеграция с Back4App

### Класс Product

```
Поля:
- objectId (String) - Уникальный ID товара
- title (String) - Название товара
- description (String) - Подробное описание
- price (Number) - Цена в рублях
- stock (Number) - Количество на складе
- category (String) - Категория товара
- image (String) - URL основного изображения
- images (Array) - Массив URL всех изображений
- rating (Number) - Рейтинг товара (0-5)
- reviews (Number) - Количество отзывов
- vendorId (Pointer<_User>) - ID вендора-продавца
- createdAt (Date) - Дата создания
- updatedAt (Date) - Дата последнего изменения
```

### Класс Order

```
Поля:
- objectId (String) - Уникальный ID заказа
- orderId (String) - Публичный номер заказа
- vendorId (Pointer<_User>) - ID вендора
- customerId (Pointer<_User>) - ID покупателя
- products (Array) - Массив товаров в заказе
  ├─ productId (String)
  ├─ quantity (Number)
  └─ price (Number)
- status (String) - Статус: pending, confirmed, shipped, delivered, cancelled
- totalAmount (Number) - Общая сумма заказа
- shippingAddress (String) - Адрес доставки
- createdAt (Date)
- updatedAt (Date)
```

### Класс Transaction

```
Поля:
- objectId (String) - ID транзакции
- vendorId (Pointer<_User>) - ID вендора
- orderId (String) - ID связанного заказа
- amount (Number) - Сумма до комиссии
- commission (Number) - Размер комиссии маркетплейса
- netIncome (Number) - Чистый доход (amount - commission)
- type (String) - Тип: sale, refund, withdrawal
- status (String) - Статус: completed, pending, failed
- createdAt (Date)
```

---

## Структура базы данных

### Cloud Code функции для Back4App (opcional)

Создайте файл `cloud/main.js` на Back4App для расширенной функциональности:

```javascript
// Правило безопасности для товаров
Parse.Cloud.beforeFind("Product", async (req) => {
  // Вендоры видят только свои товары (если не админ)
  const user = req.user;
  if (user && user.get('role') === 'vendor') {
    req.query.equalTo('vendorId', user.id);
  }
});

// Функция расчета комиссии
Parse.Cloud.define("calculateCommission", async (req) => {
  const { amount } = req.params;
  const commissionPercent = 0.1; // 10% комиссия
  return {
    grossAmount: amount,
    commission: amount * commissionPercent,
    netIncome: amount - (amount * commissionPercent),
  };
});

// Функция создания отчета вендора
Parse.Cloud.define("vendorReport", async (req) => {
  const vendorId = req.params.vendorId;
  
  const Order = Parse.Object.extend("Order");
  const orderQuery = new Parse.Query(Order);
  orderQuery.equalTo('vendorId', vendorId);
  
  const orders = await orderQuery.find({ useMasterKey: true });
  
  let totalIncome = 0;
  let totalOrders = 0;
  let totalCommission = 0;
  
  orders.forEach(order => {
    const amount = order.get('totalAmount') || 0;
    totalIncome += amount;
    totalOrders += 1;
    totalCommission += amount * 0.1;
  });
  
  return {
    vendorId,
    totalIncome,
    totalOrders,
    totalCommission,
    netIncome: totalIncome - totalCommission,
  };
});
```

---

## Пермиссии безопасности в Back4App

### Рекомендуемые правила доступа:

```
Class: Product
- Public Read: ✓ (все могут просматривать)
- Public Write: ✗
- Authenticated Create: ✓ (только вендоры)
- Authenticated Write: Только свои товары (CloudCode правило)
- Authenticated Delete: Только свои товары

Class: Order
- Public Read: ✗
- Public Write: ✗
- Authenticated Create: ✓
- Authenticated Write: Вендоры - только свои, Клиенты - только свои
- Authenticated Read: Только свои

Class: Transaction
- Public Read: ✗
- Public Write: ✗
- Authenticated Read: Только свои
```

---

## Тестирование

### Проверка подключения

```typescript
// test-back4app.ts
import * as parseSDK from './services/parseSDK';

export async function testBack4AppConnection() {
  console.log('🧪 Тестирование подключения к Back4App...');
  
  try {
    // Инициализируем
    parseSDK.initializeParse();
    console.log('✅ Parse инициализирован');
    
    // Проверяем текущего пользователя
    const user = parseSDK.getCurrentUser();
    console.log('✅ Статус пользователя:', user ? 'Авторизован' : 'Не авторизован');
    
    console.log('🎉 Все системы работают корректно!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}
```

---

## Часто задаваемые вопросы

### Q: Как сменить язык интерфейса?
A: Пока поддерживается только русский язык. Для добавления поддержки других языков используйте библиотеку `i18next`.

### Q: Какой максимальный размер файла для изображений?
A: Back4App позволяет загружать файлы до 128 MB, но рекомендуется сжимать изображения до 5-10 MB.

### Q: Как настроить комиссию маркетплейса?
A: Комиссия задается в Cloud Code функции `calculateCommission`. Измените значение `commissionPercent`.

### Q: Можно ли экспортировать отчеты в PDF?
A: Да, используйте библиотеку `pdfkit` или `html2pdf` для создания PDF отчетов.

---

## Контакты и поддержка

- **Документация Back4App**: https://www.back4app.com/docs
- **Parse SDK GitHub**: https://github.com/parse-community/Parse-SDK-JS
- **Форум поддержки**: https://community.back4app.com

---

**Версия документации**: 1.0  
**Последнее обновление**: 1 декабря 2025  
**Автор**: AI Assistant
