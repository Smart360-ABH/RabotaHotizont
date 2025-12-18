import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useMarket } from '../context/MarketContext';
import * as back4app from '../services/back4appRest';
import { LogIn, AlertCircle, UserPlus } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const market = useMarket();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login state
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // Register state
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as 'customer' | 'vendor'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!back4app.isInitialized()) {
        throw new Error('Back4App не инициализирован');
      }

      const username = loginData.username.trim();
      const password = loginData.password.trim();

      console.log('Login attempt:', { username, password });

      let response;
      if (username === 'john_doe' && password === 'password123') {
        console.log('✅ Mock login logic triggered for john_doe');
        const mockUser = {
          objectId: 'RvDjRB413H', // Real customer ID from DB (pokupka)
          id: 'RvDjRB413H',
          username: 'john_doe',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user' as const,
          sessionToken: 'mock_session_token_' + Date.now()
        };
        login(mockUser as any);
        setSuccess('Вход успешен! (Mock)');
        setTimeout(() => navigate('/'), 500);
        return;
      } else if (username === 'v_tech_vendor' && password === 'password123') {
        console.log('✅ Mock login logic triggered for v_tech_vendor');
        const mockUser = {
          objectId: 'qoK5mTF2Lo', // Real vendor ID from DB (Vladikabh23)
          id: 'qoK5mTF2Lo',
          username: 'v_tech_vendor',
          name: 'TechnoPoint Owner',
          email: 'vendor@example.com',
          role: 'vendor' as const,
          vendorId: 'qoK5mTF2Lo',
          sessionToken: 'mock_session_token_vendor_' + Date.now()
        };
        login(mockUser as any);
        setSuccess('Вход успешен! (Mock Vendor)');
        setTimeout(() => navigate('/'), 500);
        return;
      } else {
        response = await back4app.loginUser(loginData.username, loginData.password);
      }

      login({
        objectId: response.objectId,
        username: response.username,
        name: response.name || response.username,
        email: response.email,
        role: (response.role as any) || (response.email && response.email.includes('admin') ? 'admin' : 'customer'),
        sessionToken: response.sessionToken
      });

      setSuccess('Вход успешен!');
      setTimeout(() => navigate('/'), 500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ошибка входа';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!registerData.username || !registerData.email || !registerData.password) {
      setError('Заполните все поля');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      if (!back4app.isInitialized()) {
        throw new Error('Back4App не инициализирован');
      }

      await back4app.registerUser(
        registerData.username,
        registerData.email,
        registerData.password,
        registerData.role
      );

      setSuccess('Регистрация успешна! Входите с вашими данными.');
      setRegisterData({ username: '', email: '', password: '', confirmPassword: '', role: 'customer' });
      setAuthMode('login');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ошибка регистрации';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => { setAuthMode('login'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 font-semibold transition ${authMode === 'login' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <LogIn className="inline mr-2" size={18} /> Вход
          </button>
          <button
            onClick={() => { setAuthMode('register'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 font-semibold transition ${authMode === 'register' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <UserPlus className="inline mr-2" size={18} /> Регистрация
          </button>
        </div>

        <div className="p-8">
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Вход в аккаунт</h2>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded flex items-start gap-2">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded">
                  ✓ {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  name="username"
                  value={loginData.username}
                  onChange={handleLoginChange}
                  onFocus={() => setLoginData({ ...loginData, username: '' })}
                  placeholder="john_doe"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Пароль
                </label>
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  onFocus={() => setLoginData({ ...loginData, password: '' })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {loading ? 'Загрузка...' : 'Войти'}
              </button>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-1">Тестовые данные:</p>
                <p>User: <code className="bg-white dark:bg-slate-800 px-1 rounded">john_doe</code></p>
                <p>Pass: <code className="bg-white dark:bg-slate-800 px-1 rounded">password123</code></p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Регистрация</h2>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded flex items-start gap-2">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded">
                  ✓ {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  name="username"
                  value={registerData.username}
                  onChange={handleRegisterChange}
                  placeholder="john_doe"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Пароль
                </label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Подтвердите пароль
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Роль
                </label>
                <select
                  name="role"
                  value={registerData.role}
                  onChange={handleRegisterChange}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="customer">Покупатель</option>
                  <option value="vendor">Продавец</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;