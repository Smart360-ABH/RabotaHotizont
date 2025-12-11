# 🛍️ Market - Полная интеграция Back4App

Проект маркетплейса с полной интеграцией Back4App для управления пользователями, товарами, заказами и продавцами.

## ✅ Что реализовано

### 🔐 Аутентификация (Back4App)
- Регистрация пользователей (покупатели и продавцы)
- Вход в аккаунт
- Сохранение сессии в localStorage
- UserContext для управления авторизацией

### 📦 Управление товарами (Back4App)
- Добавление товаров продавцами
- Просмотр каталога товаров
- Фильтрация по категориям
- Редактирование и удаление товаров

### 🛒 Заказы и чекаут (Back4App)
- Создание заказов при покупке
- История заказов в профиле
- Отслеживание статуса заказа
- Корзина с синхронизацией

### 👥 Управление профилем (Back4App)
- Просмотр профиля пользователя
- История заказов
- Избранные товары (wishlist)
- Данные продавца (для vendors)

---

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:
```
VITE_PARSE_APP_ID=XLiNP1wljZYgnjhgjy4RHrjvKx3OLKI6OCMwZQvA
VITE_PARSE_REST_KEY=BadiMhfYEd68wGyu2X4JslEQsDIGJCqsBpc0cOBn
VITE_PARSE_JS_KEY=9Aa5EmVv6ujuZhEfRcbvfCTZhSte721MaTXb5l7m
```

**⚠️ ВАЖНО:** Замените эти значения на ваши собственные ключи Back4App!

### 3. Инициализация БД

Запустите seed-скрипт для создания класс ов и примеров данных:
```bash
$env:VITE_PARSE_APP_ID = 'ВАШ_APP_ID'
$env:VITE_PARSE_REST_KEY = 'ВАШ_REST_KEY'
npm run seed:back4app
```

### 4. Запуск dev-сервера
```bash
npm run dev
```

Откройте `http://localhost:5173` в браузере.

---

## 📝 Тестовые данные

После запуска seed-скрипта доступны:

### Пользователи
- **Покупатель:** `john_doe` / `password123`
- **Продавец:** `vendor_user` / `password123`

### Товары
- The Art of Programming (89.99$)
- Mechanical Keyboard RGB (149.99$)

### Продавцы (Vendors)
- Smart Books
- Tech Supplies Co

---

## 📂 Структура Back4App классов

### `_User`
Встроенный класс для авторизации
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "customer|vendor|admin"
}
```

### `Product`
Товары на продажу
```json
{
  "title": "string",
  "author": "string",
  "category": "books|stationery|electronics|other",
  "price": "number",
  "description": "string",
  "vendorId": "string (Vendor objectId)",
  "stock": "number",
  "rating": "number"
}
```

### `Vendor`
Информация о продавцах
```json
{
  "name": "string",
  "email": "string",
  "description": "string",
  "rating": "number"
}
```

### `Order`
Заказы покупателей
```json
{
  "userId": "string (_User objectId)",
  "items": [
    { "productId": "string", "title": "string", "price": "number", "quantity": "number" }
  ],
  "total": "number",
  "status": "pending|processing|shipped|completed|cancelled",
  "shippingAddress": "string"
}
```

### `Favorite`
Избранные товары (wishlist)
```json
{
  "userId": "string",
  "productId": "string"
}
```

---

## 🛠️ API Helper функции (`services/back4appRest.ts`)

### Аутентификация
```ts
registerUser(username, email, password, role)
loginUser(username, password)
getUserById(userId)
updateUser(userId, fields)
```

### Товары
```ts
createProduct(data)
getProducts(limit)
getProductsByCategory(category)
getProductById(productId)
updateProduct(productId, fields)
deleteProduct(productId)
```

### Продавцы
```ts
createVendor(data)
getVendors()
getVendorById(vendorId)
updateVendor(vendorId, fields)
```

### Заказы
```ts
createOrder(data)
getOrdersByUser(userId)
getOrderById(orderId)
updateOrder(orderId, fields)
deleteOrder(orderId)
```

### Избранное
```ts
addToFavorites(userId, productId)
getFavoritesByUser(userId)
removeFavorite(favoriteId)
```

---

## 📚 Примеры использования

### Получить все товары
```ts
import * as back4app from './services/back4appRest';

const products = await back4app.getProducts();
console.log(products);
```

### Создать заказ
```ts
const order = await back4app.createOrder({
  userId: 'USER_ID',
  items: [
    { productId: 'PRODUCT_ID', title: 'Book', price: 99, quantity: 1 }
  ],
  total: 99,
  status: 'pending',
  shippingAddress: '123 Main St, City'
});
```

### Получить заказы пользователя
```ts
const userOrders = await back4app.getOrdersByUser('USER_ID');
```

---

## 🔑 Контексты и Hooks

### UserContext
Управление авторизацией и текущим пользователем
```ts
import { useUser } from './context/UserContext';

const { user, isLoggedIn, login, logout } = useUser();
```

### MarketContext
Управление корзиной и товарами (существующий контекст)
```ts
import { useMarket } from './context/MarketContext';

const { cart, addToCart, removeFromCart } = useMarket();
```

---

## 🎯 Компоненты

### `RegisterForm`
Форма регистрации с выбором роли
```tsx
import RegisterForm from './components/RegisterForm';

<RegisterForm />
```

### `AddProductForm`
Форма добавления товаров (для продавцов)
```tsx
import AddProductForm from './components/AddProductForm';

<AddProductForm vendorId="VENDOR_ID" />
```

### `TestBack4App`
Тестовый компонент для CRUD операций
```tsx
import TestBack4App from './components/TestBack4App';

<TestBack4App />
```

Доступен по маршруту: `/#/test-back4app`

---

## 🔧 Скрипты npm

```bash
npm run dev          # Запуск dev-сервера (Vite)
npm run build        # Сборка для production
npm run preview      # Просмотр production сборки
npm run seed:back4app  # Инициализация БД (требует env vars)
```

---

## ⚙️ Конфигурация Vite

Файл `vite.config.ts` уже содержит:
- Разрешение для хоста `market-syrc.onrender.com` (для production)
- Настройка environment переменных
- Алиасы для импортов

---

## 🚨 Возможные ошибки

### "Back4App не инициализирован"
**Причина:** Не заданы переменные окружения VITE_PARSE_APP_ID или VITE_PARSE_REST_KEY

**Решение:** Проверьте файл `.env.local` и перезапустите dev-сервер

### "unauthorized"
**Причина:** Неправильный REST API Key

**Решение:** Получите правильный REST API Key из Back4App Dashboard и обновите `.env.local`

### "Account already exists for this username"
**Причина:** При повторном запуске seed-скрипта пользователи уже существуют

**Решение:** Это нормально - просто используйте существующие учетные данные

---

## 📱 Маршруты приложения

| Маршрут | Описание |
|---------|---------|
| `/` | Главная страница |
| `/catalog` | Каталог товаров |
| `/login` | Вход/Регистрация |
| `/profile` | Профиль пользователя (защищён) |
| `/cart` | Корзина |
| `/checkout` | Оформление заказа |
| `/vendor` | Dashboard продавца (защищён) |
| `/test-back4app` | Тестирование Back4App API |

---

## 🔐 Безопасность

- ❌ **Не коммитьте .env.local** в Git!
- ✅ Используйте разные ключи для dev и production
- ✅ Сохраняйте sessionToken в защищенном хранилище
- ✅ Проверяйте роль пользователя перед доступом к функциям

---

## 📞 Контакты

**Email:** service-abh@yandex.ru  
**GitHub:** [Smart360-ABH/market](https://github.com/Smart360-ABH/market)

---

## 📄 Лицензия

MIT License - вы можете использовать этот проект как угодно.

---

**Последнее обновление:** 30 ноября 2025 г.
