
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, User, Store } from 'lucide-react';

export const Login: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [registerRole, setRegisterRole] = useState<'buyer' | 'seller'>('buyer');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State (Buyer)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, loginWithCredentials } = useMarket();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Используем loginWithCredentials из контекста, который поддерживает Back4App
      const success = await loginWithCredentials(email, password);
      
      if (success) {
        setIsLoading(false);
        // Определяем роль по email для переадресации (в Back4App это будет в userData)
        if (email.includes('admin')) {
          navigate('/admin');
        } else if (email.includes('vendor')) {
          navigate('/vendor');
        } else {
          navigate('/');
        }
      } else {
        setIsLoading(false);
        setError('Ошибка входа. Проверьте email и пароль.');
      }
    } catch (err) {
      setIsLoading(false);
      console.error('[Login] Error:', err);
      setError('Ошибка входа. Попробуйте позже.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (regPassword !== regConfirmPassword) {
          setError('Пароли не совпадают');
          return;
      }
      
      setIsLoading(true);
      
      // Simulate API Registration
      setTimeout(() => {
          setIsLoading(false);
          login('user'); // Auto-login as buyer
          navigate('/');
      }, 1000);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden py-12 min-h-[calc(100vh-160px)]">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-slate-700 relative z-10 mx-4">
            
            {/* Header Tabs */}
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 mb-8">
                <button 
                    onClick={() => { setAuthMode('login'); setError(''); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition ${authMode === 'login' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    Вход
                </button>
                <button 
                    onClick={() => { setAuthMode('register'); setError(''); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition ${authMode === 'register' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    Регистрация
                </button>
            </div>

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {authMode === 'login' ? 'С возвращением!' : 'Создание аккаунта'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                    {authMode === 'login' ? 'Введите свои данные для доступа' : 'Выберите тип профиля'}
                </p>
            </div>

            {authMode === 'login' ? (
                // --- LOGIN FORM ---
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input 
                                type="email" 
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase">Пароль</label>
                            <a href="#" className="text-xs text-indigo-600 hover:underline">Забыли пароль?</a>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input 
                                type="password" 
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg animate-fade-in">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>Войти <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>
                    
                    <div className="text-center pt-4">
                        <p className="text-xs text-gray-400 mb-2">Демо аккаунты:</p>
                        <div className="flex justify-center gap-2 text-xs">
                             <span className="cursor-pointer text-indigo-500 hover:underline" onClick={() => {setEmail('admin@store.com'); setPassword('admin')}}>Admin</span>
                             <span>•</span>
                             <span className="cursor-pointer text-indigo-500 hover:underline" onClick={() => {setEmail('vendor@store.com'); setPassword('vendor')}}>Vendor</span>
                             <span>•</span>
                             <span className="cursor-pointer text-indigo-500 hover:underline" onClick={() => {setEmail('user@store.com'); setPassword('user')}}>User</span>
                        </div>
                    </div>
                </form>
            ) : (
                // --- REGISTER FORM ---
                <div className="space-y-6">
                    {/* Role Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div 
                            onClick={() => setRegisterRole('buyer')}
                            className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition ${registerRole === 'buyer' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'}`}
                        >
                            <User className={`w-6 h-6 ${registerRole === 'buyer' ? 'text-indigo-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-bold ${registerRole === 'buyer' ? 'text-indigo-900 dark:text-white' : 'text-gray-500'}`}>Покупатель</span>
                        </div>
                        <div 
                            onClick={() => setRegisterRole('seller')}
                            className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition ${registerRole === 'seller' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'}`}
                        >
                            <Store className={`w-6 h-6 ${registerRole === 'seller' ? 'text-purple-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-bold ${registerRole === 'seller' ? 'text-purple-900 dark:text-white' : 'text-gray-500'}`}>Продавец</span>
                        </div>
                    </div>

                    {registerRole === 'seller' ? (
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                            <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-2">Станьте партнером Горизонта</h3>
                            <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                                Для регистрации магазина требуется заполнить анкету предпринимателя и выбрать модель логистики.
                            </p>
                            <Link 
                                to="/become-seller"
                                className="block w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition shadow-lg shadow-purple-500/30"
                            >
                                Перейте к регистрации продавца
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ваше имя</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none"
                                    placeholder="Иван Иванов"
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input 
                                    type="email" 
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none"
                                    placeholder="name@example.com"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Пароль</label>
                                    <input 
                                        type="password" 
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none"
                                        placeholder="******"
                                        value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Повтор</label>
                                    <input 
                                        type="password" 
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none"
                                        placeholder="******"
                                        value={regConfirmPassword}
                                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            
                            {error && (
                                <div className="text-red-500 text-xs text-center">{error}</div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    'Зарегистрироваться'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};