
import { config } from '../config';
import { MOCK_PRODUCTS } from '../constants';
import { Product, User, OrderDetails } from '../types';

// Имитация задержки сети для реалистичности
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- ТОВАРЫ ---
  async getProducts(): Promise<Product[]> {
    if (config.USE_MOCK) {
      await delay(500); // Имитация загрузки
      return MOCK_PRODUCTS;
    }
    
    // Реальный запрос к бэкенду
    const res = await fetch(`${config.API_URL}/products`);
    return res.json();
  },

  async getProductById(id: string): Promise<Product | undefined> {
    if (config.USE_MOCK) {
      return MOCK_PRODUCTS.find(p => p.id === id);
    }
    const res = await fetch(`${config.API_URL}/products/${id}`);
    return res.json();
  },

  // --- ЗАКАЗЫ ---
  async createOrder(order: any): Promise<{ success: boolean; orderId?: string }> {
    if (config.USE_MOCK) {
      await delay(1000);
      console.log('Order created (MOCK):', order);
      return { success: true, orderId: `ORD-${Date.now()}` };
    }

    const res = await fetch(`${config.API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return res.json();
  },

  // --- АВТОРИЗАЦИЯ ---
  async login(email: string, password: string): Promise<User | null> {
    if (config.USE_MOCK) {
       await delay(800);
       // Простая имитация проверки (в реальности это делает сервер)
       if (email.includes('admin')) return { id: 'a1', name: 'Admin', email, role: 'admin' };
       if (email.includes('vendor')) return { id: 'v1', name: 'Vendor', email, role: 'vendor', vendorId: 'v1' };
       return { id: 'u1', name: 'User', email, role: 'user' };
    }

    const res = await fetch(`${config.API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    return res.json();
  }
};
