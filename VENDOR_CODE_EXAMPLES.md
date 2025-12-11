# Примеры кода: Интеграция Личного кабинета Вендора с Back4App

Этот файл содержит практические примеры использования всех основных операций.

## 1. ИНИЦИАЛИЗАЦИЯ PARSE

### main.tsx
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import * as parseSDK from './services/parseSDK'

// Инициализируем Parse/Back4App при запуске приложения
parseSDK.initializeParse()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

## 2. АУТЕНТИФИКАЦИЯ

### Компонент входа вендора
```typescript
import { useState } from 'react'
import * as parseSDK from '../services/parseSDK'

export function VendorLoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Вход в систему
      const user = await parseSDK.loginUser(username, password)
      
      // Проверяем, что это вендор
      if (user.get('role') !== 'vendor') {
        throw new Error('Этот аккаунт не является аккаунтом продавца')
      }

      // Сохраняем данные в контекст
      console.log('✅ Вендор успешно авторизован:', user.get('username'))
      
      // Перенаправляем на дашборд
      window.location.href = '/vendor/dashboard'
    } catch (err: any) {
      setError(err.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Имя пользователя"
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  )
}
```

### Регистрация нового вендора
```typescript
export async function registerNewVendor(
  username: string,
  email: string,
  password: string,
  storeName: string
) {
  try {
    // Создаем аккаунт вендора
    const user = await parseSDK.registerUser(username, email, password, 'vendor')
    
    // Обновляем профиль с информацией о магазине
    await parseSDK.updateUserProfile(user.id, {
      vendorName: storeName,
      storeName: storeName,
      name: username,
    })

    console.log('✅ Вендор успешно зарегистрирован')
    return user
  } catch (error) {
    console.error('❌ Ошибка регистрации:', error)
    throw error
  }
}
```

---

## 3. УПРАВЛЕНИЕ ТОВАРАМИ

### Создание нового товара
```typescript
export async function createNewProduct(
  vendorId: string,
  productData: {
    title: string
    description: string
    price: number
    stock: number
    category: string
    imageFile?: File
  }
) {
  try {
    let imageUrl: string | undefined

    // Если есть изображение, загружаем его
    if (productData.imageFile) {
      console.log('📸 Загружаем изображение...')
      imageUrl = await parseSDK.uploadProductImage(productData.imageFile)
      console.log('✅ Изображение загружено:', imageUrl)
    }

    // Создаем товар
    const product = await parseSDK.createProduct(vendorId, {
      title: productData.title,
      description: productData.description,
      price: productData.price,
      stock: productData.stock,
      category: productData.category,
      image: imageUrl,
      vendorId: vendorId,
    })

    console.log('✅ Товар создан:', product.id)
    return product
  } catch (error) {
    console.error('❌ Ошибка создания товара:', error)
    throw error
  }
}
```

### Получение товаров вендора с фильтром
```typescript
export async function getVendorProductsByCategory(
  vendorId: string,
  category?: string
) {
  try {
    // Получаем все товары вендора
    const products = await parseSDK.getProductsByVendor(vendorId)

    // Фильтруем по категории если указана
    const filtered = category
      ? products.filter((p: any) => p.get('category') === category)
      : products

    console.log(`📦 Найдено ${filtered.length} товаров`)
    
    return filtered.map((p: any) => ({
      objectId: p.id,
      title: p.get('title'),
      price: p.get('price'),
      stock: p.get('stock'),
      category: p.get('category'),
      image: p.get('image'),
    }))
  } catch (error) {
    console.error('❌ Ошибка загрузки товаров:', error)
    throw error
  }
}
```

### Массовое обновление цен
```typescript
export async function updateProductPrices(
  productIds: string[],
  priceMultiplier: number = 1.1 // 10% повышение
) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const productId of productIds) {
    try {
      const product = await parseSDK.getProductById(productId)
      const oldPrice = product.get('price')
      const newPrice = oldPrice * priceMultiplier

      await parseSDK.updateProduct(productId, {
        price: newPrice,
      })

      console.log(`✅ ${product.get('title')}: ${oldPrice} → ${newPrice}`)
      results.success++
    } catch (error) {
      results.failed++
      results.errors.push(`${productId}: ${error}`)
    }
  }

  console.log(`📊 Результаты: ${results.success} успешно, ${results.failed} ошибок`)
  return results
}
```

---

## 4. УПРАВЛЕНИЕ ЗАКАЗАМИ

### Получение новых заказов
```typescript
export async function getNewOrders(vendorId: string) {
  try {
    const orders = await parseSDK.getOrdersByVendor(vendorId)
    
    // Фильтруем только ожидающие заказы
    const newOrders = orders.filter((o: any) => o.get('status') === 'pending')
    
    console.log(`🔔 Новых заказов: ${newOrders.length}`)
    
    return newOrders.map((o: any) => ({
      objectId: o.id,
      orderId: o.get('orderId'),
      customerId: o.get('customerId'),
      totalAmount: o.get('totalAmount'),
      status: o.get('status'),
      createdAt: o.createdAt,
    }))
  } catch (error) {
    console.error('❌ Ошибка загрузки заказов:', error)
    throw error
  }
}
```

### Процесс обработки заказа
```typescript
export async function processOrderWorkflow(orderId: string) {
  try {
    // Шаг 1: Подтверждение заказа
    console.log('📋 Подтверждаем заказ...')
    await parseSDK.updateOrderStatus(orderId, 'confirmed')
    console.log('✅ Заказ подтвержден')

    // Шаг 2: Отправка заказа
    console.log('📦 Отправляем заказ...')
    await parseSDK.updateOrderStatus(orderId, 'shipped')
    console.log('✅ Заказ отправлен')

    // Получаем актуальные данные
    const order = await parseSDK.getOrderById(orderId)
    console.log('📊 Статус заказа:', order?.get('status'))

    return {
      success: true,
      orderId,
      status: order?.get('status'),
    }
  } catch (error) {
    console.error('❌ Ошибка обработки заказа:', error)
    return { success: false, error }
  }
}
```

### Отмена заказа и создание возврата
```typescript
export async function cancelOrderAndCreateRefund(
  orderId: string,
  vendorId: string,
  reason: string
) {
  try {
    // Отмена заказа
    console.log('❌ Отменяем заказ...')
    const order = await parseSDK.getOrderById(orderId)
    
    await parseSDK.updateOrderStatus(orderId, 'cancelled')
    console.log('✅ Заказ отменен')

    // Создание транзакции возврата
    const totalAmount = order?.get('totalAmount') || 0
    
    await parseSDK.createTransaction({
      vendorId,
      orderId,
      amount: totalAmount,
      commission: 0,
      netIncome: totalAmount, // Возврат полной суммы
      type: 'refund',
      status: 'completed',
    })

    console.log(`💰 Возврат создан: ${totalAmount} ₽`)
    
    return { success: true, refundAmount: totalAmount }
  } catch (error) {
    console.error('❌ Ошибка при возврате:', error)
    throw error
  }
}
```

---

## 5. ФИНАНСОВАЯ АНАЛИТИКА

### Получение финансовой статистики
```typescript
export async function getFinancialStats(vendorId: string) {
  try {
    // Получаем отчет
    const report = await parseSDK.getFinancialReport(vendorId)
    
    // Вычисляем дополнительные метрики
    const averageOrderValue = report.transactionCount > 0
      ? report.totalIncome / report.transactionCount
      : 0

    const commissionRate = report.totalIncome > 0
      ? (report.totalCommission / report.totalIncome) * 100
      : 0

    return {
      ...report,
      averageOrderValue,
      commissionRate: commissionRate.toFixed(2),
    }
  } catch (error) {
    console.error('❌ Ошибка при получении статистики:', error)
    throw error
  }
}
```

### Генерация месячного отчета
```typescript
export async function generateMonthlyReport(vendorId: string) {
  try {
    const transactions = await parseSDK.getTransactionsByVendor(vendorId)
    
    // Фильтруем транзакции текущего месяца
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyTransactions = transactions.filter((t: any) => {
      const txDate = new Date(t.createdAt)
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
    })

    // Агрегируем данные
    let totalSales = 0
    let totalRefunds = 0
    let totalCommission = 0
    let successfulTransactions = 0

    monthlyTransactions.forEach((tx: any) => {
      if (tx.get('status') === 'completed') {
        successfulTransactions++
        if (tx.get('type') === 'sale') {
          totalSales += tx.get('amount')
          totalCommission += tx.get('commission')
        } else if (tx.get('type') === 'refund') {
          totalRefunds += tx.get('amount')
        }
      }
    })

    const netIncome = totalSales - totalCommission - totalRefunds

    return {
      month: new Date(currentYear, currentMonth).toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric',
      }),
      totalSales,
      totalRefunds,
      totalCommission,
      netIncome,
      transactionCount: monthlyTransactions.length,
      successfulTransactions,
      averageTransactionValue: successfulTransactions > 0
        ? totalSales / successfulTransactions
        : 0,
    }
  } catch (error) {
    console.error('❌ Ошибка генерации отчета:', error)
    throw error
  }
}
```

---

## 6. ЗАГРУЗКА ФАЙЛОВ (ИЗОБРАЖЕНИЙ)

### Оптимизация изображений перед загрузкой
```typescript
export async function uploadOptimizedImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = async () => {
        // Создаем canvas для сжатия
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Масштабируем если больше максимума
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        // Конвертируем обратно в файл
        canvas.toBlob(
          async (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, { type: 'image/jpeg' })
              const url = await parseSDK.uploadProductImage(optimizedFile)
              resolve(url)
            } else {
              reject(new Error('Ошибка сжатия изображения'))
            }
          },
          'image/jpeg',
          0.85 // 85% качество JPEG
        )
      }

      img.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}
```

---

## 7. ОБРАБОТКА ОШИБОК И ЛОГИРОВАНИЕ

### Утилита для логирования операций
```typescript
export class VendorLogger {
  static log(type: 'info' | 'success' | 'error' | 'warning', message: string, data?: any) {
    const timestamp = new Date().toLocaleTimeString('ru-RU')
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
    }

    const prefix = `[${timestamp}] ${emoji[type]}`
    
    if (data) {
      console.log(`${prefix} ${message}`, data)
    } else {
      console.log(`${prefix} ${message}`)
    }

    // Можно добавить отправку логов на сервер
    // await sendLogToServer({ type, message, data, timestamp })
  }
}

// Использование
VendorLogger.log('success', 'Товар успешно создан', { productId: '123' })
VendorLogger.log('error', 'Ошибка при загрузке изображения', { fileName: 'image.jpg' })
```

---

## 8. ХУКИ REACT ДЛЯ УПРАВЛЕНИЯ ТОВАРАМИ

### useVendorProducts - кастомный хук
```typescript
import { useState, useEffect } from 'react'
import * as parseSDK from '../services/parseSDK'

export function useVendorProducts(vendorId: string) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [vendorId])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const items = await parseSDK.getProductsByVendor(vendorId)
      setProducts(items.map((p: any) => ({
        objectId: p.id,
        title: p.get('title'),
        price: p.get('price'),
        stock: p.get('stock'),
        category: p.get('category'),
        image: p.get('image'),
      })))
    } catch (err) {
      setError('Ошибка загрузки товаров')
    } finally {
      setLoading(false)
    }
  }

  const addProduct = async (productData: any) => {
    try {
      const newProduct = await parseSDK.createProduct(vendorId, productData)
      setProducts([...products, {
        objectId: newProduct.id,
        ...productData,
      }])
    } catch (err) {
      throw err
    }
  }

  const updateProduct = async (productId: string, updates: any) => {
    try {
      await parseSDK.updateProduct(productId, updates)
      setProducts(products.map((p: any) =>
        p.objectId === productId ? { ...p, ...updates } : p
      ))
    } catch (err) {
      throw err
    }
  }

  const deleteProduct = async (productId: string) => {
    try {
      await parseSDK.deleteProduct(productId)
      setProducts(products.filter((p: any) => p.objectId !== productId))
    } catch (err) {
      throw err
    }
  }

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    refresh: loadProducts,
  }
}

// Использование в компоненте
function ProductsList({ vendorId }) {
  const { products, loading, addProduct } = useVendorProducts(vendorId)

  return (
    <div>
      {loading ? <p>Загрузка...</p> : (
        <ul>
          {products.map((p) => (
            <li key={p.objectId}>{p.title} - {p.price} ₽</li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

---

## 9. ИНТЕГРАЦИЯ С КОНТЕКСТОМ

```typescript
// VendorContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react'
import * as parseSDK from '../services/parseSDK'

interface VendorContextType {
  vendorId: string | null
  vendorName: string
  loading: boolean
  stats: {
    totalProducts: number
    totalOrders: number
    totalIncome: number
  } | null
  loadVendorStats: () => Promise<void>
}

const VendorContext = createContext<VendorContextType | undefined>(undefined)

export function VendorProvider({ children }: { children: ReactNode }) {
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [vendorName, setVendorName] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)

  const loadVendorStats = async () => {
    const user = parseSDK.getCurrentUser()
    if (!user) return

    setLoading(true)
    try {
      const products = await parseSDK.getProductsByVendor(user.id)
      const orders = await parseSDK.getOrdersByVendor(user.id)
      const report = await parseSDK.getFinancialReport(user.id)

      setVendorId(user.id)
      setVendorName(user.get('vendorName') || user.get('username'))
      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalIncome: report.netIncome,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <VendorContext.Provider value={{
      vendorId: vendorId || '',
      vendorName,
      loading,
      stats,
      loadVendorStats,
    }}>
      {children}
    </VendorContext.Provider>
  )
}

export function useVendor() {
  const context = useContext(VendorContext)
  if (!context) {
    throw new Error('useVendor должен использоваться внутри VendorProvider')
  }
  return context
}
```

---

Это полный набор примеров, охватывающих все основные операции работы с Личным кабинетом Вендора!
