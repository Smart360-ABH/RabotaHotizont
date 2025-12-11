/**
 * Компонент аутентификации вендора (вход/выход)
 * Интеграция с Parse SDK для управления сессией пользователя
 */

import React, { useState } from 'react';
import { LogIn, UserPlus, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';
import * as parseSDK from '../services/parseSDK';

interface VendorAuthProps {
  onLoginSuccess: (user: any) => void;
}

type AuthMode = 'login' | 'register';

const VendorAuth: React.FC<VendorAuthProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Форма входа
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  // Форма регистрации
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    vendorName: '',
    acceptTerms: false,
  });

  // Обработка входа
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginForm.username || !loginForm.password) {
      setError('Заполните все поля');
      return;
    }

    try {
      setLoading(true);
      const user = await parseSDK.loginUser(loginForm.username, loginForm.password);
      
      onLoginSuccess({
        objectId: user.id,
        username: user.get('username'),
        email: user.get('email'),
        role: user.get('role') || 'customer',
        sessionToken: user.getSessionToken(),
      });
    } catch (err: any) {
      console.error('Ошибка входа:', err);
      setError(err.message || 'Неверные учетные данные. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  // Обработка регистрации
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Валидация
    if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.vendorName) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (!registerForm.acceptTerms) {
      setError('Вы должны согласиться с условиями использования');
      return;
    }

    try {
      setLoading(true);
      const user = await parseSDK.registerUser(
        registerForm.username,
        registerForm.email,
        registerForm.password,
        'vendor'
      );

      // Сразу авторизуем после регистрации
      await parseSDK.logoutUser(); // Очищаем предыдущую сессию
      const loginUser = await parseSDK.loginUser(registerForm.username, registerForm.password);

      onLoginSuccess({
        objectId: loginUser.id,
        username: loginUser.get('username'),
        email: loginUser.get('email'),
        role: 'vendor',
        sessionToken: loginUser.getSessionToken(),
      });
    } catch (err: any) {
      console.error('Ошибка регистрации:', err);
      setError(err.message || 'Ошибка регистрации. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Карточка аутентификации */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl overflow-hidden">
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
            <h1 className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Вход в панель продавца' : 'Регистрация продавца'}
            </h1>
            <p className="text-indigo-100 text-sm mt-2">
              {mode === 'login'
                ? 'Управляйте своим магазином'
                : 'Начните продавать на маркетплейсе'}
            </p>
          </div>

          {/* Контент */}
          <div className="p-6">
            {/* Ошибка */}
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {mode === 'login' ? (
              // ФОРМА ВХОДА
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Имя пользователя */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    placeholder="Ваше имя пользователя"
                  />
                </div>

                {/* Пароль */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Кнопка входа */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Входим...
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      Войти
                    </>
                  )}
                </button>

                {/* Ссылка на регистрацию */}
                <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
                  Новый продавец?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Зарегистрироваться
                  </button>
                </p>
              </form>
            ) : (
              // ФОРМА РЕГИСТРАЦИИ
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Имя пользователя */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    placeholder="Уникальное имя пользователя"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Имя магазина */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Имя магазина/бренда
                  </label>
                  <input
                    type="text"
                    value={registerForm.vendorName}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, vendorName: e.target.value }))}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    placeholder="Название вашего магазина"
                  />
                </div>

                {/* Пароль */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      placeholder="Минимум 6 символов"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Подтверждение пароля */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Подтвердите пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Согласие с условиями */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={registerForm.acceptTerms}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                    disabled={loading}
                    className="mt-1 rounded"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
                    Я согласен с{' '}
                    <a href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                      условиями использования
                    </a>{' '}
                    и{' '}
                    <a href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                      политикой конфиденциальности
                    </a>
                  </label>
                </div>

                {/* Кнопка регистрации */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Регистрируемся...
                    </>
                  ) : (
                    <>
                      <UserPlus size={20} />
                      Зарегистрироваться
                    </>
                  )}
                </button>

                {/* Ссылка на вход */}
                <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Войти
                  </button>
                </p>
              </form>
            )}
          </div>

          {/* Подвал */}
          <div className="bg-gray-50 dark:bg-slate-800/50 px-6 py-4 text-center border-t dark:border-slate-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Защищено Parse/Back4App · Все данные зашифрованы
            </p>
          </div>
        </div>

        {/* Ссылка на помощь */}
        <div className="mt-6 text-center">
          <a href="#" className="text-white hover:text-indigo-200 text-sm">
            Возникли проблемы? Свяжитесь с поддержкой
          </a>
        </div>
      </div>
    </div>
  );
};

export default VendorAuth;
