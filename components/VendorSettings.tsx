/**
 * Настройки профиля вендора
 * Редактирование данных пользователя через Parse SDK
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader, Save, User, Mail, Lock, Building, MapPin, DollarSign } from 'lucide-react';
import * as parseSDK from '../services/parseSDK';

interface VendorSettings {
  username: string;
  email: string;
  name: string;
  vendorName: string;
  storeName?: string;
  description?: string;
  address?: string;
  phone?: string;
  taxId?: string;
  bankAccount?: string;
}

interface VendorSettingsProps {
  userId: string;
}

const VendorSettings: React.FC<VendorSettingsProps> = ({ userId }) => {
  const [settings, setSettings] = useState<VendorSettings>({
    username: '',
    email: '',
    name: '',
    vendorName: '',
    storeName: '',
    description: '',
    address: '',
    phone: '',
    taxId: '',
    bankAccount: '',
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordChange, setPasswordChange] = useState({ current: '', new: '', confirm: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Загрузка данных пользователя
  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Получаем текущего пользователя из Parse
      const currentUser = parseSDK.getCurrentUser();
      
      if (currentUser) {
        setSettings({
          username: currentUser.get('username') || '',
          email: currentUser.get('email') || '',
          name: currentUser.get('name') || '',
          vendorName: currentUser.get('vendorName') || '',
          storeName: currentUser.get('storeName') || '',
          description: currentUser.get('description') || '',
          address: currentUser.get('address') || '',
          phone: currentUser.get('phone') || '',
          taxId: currentUser.get('taxId') || '',
          bankAccount: currentUser.get('bankAccount') || '',
        });
      }
    } catch (err) {
      console.error('Ошибка загрузки профиля:', err);
      setError('Не удалось загрузить профиль. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof VendorSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Обновляем профиль через Parse
      await parseSDK.updateUserProfile(userId, {
        name: settings.name,
        vendorName: settings.vendorName,
        storeName: settings.storeName,
        description: settings.description,
        address: settings.address,
        phone: settings.phone,
        taxId: settings.taxId,
        bankAccount: settings.bankAccount,
      });

      setSuccess(true);
      setEditing(false);

      // Скрываем сообщение об успехе через 3 секунды
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Ошибка сохранения профиля:', err);
      setError('Ошибка сохранения профиля. Попробуйте позже.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordChange.new || !passwordChange.confirm) {
      setError('Заполните все поля для смены пароля');
      return;
    }

    if (passwordChange.new !== passwordChange.confirm) {
      setError('Пароли не совпадают');
      return;
    }

    if (passwordChange.new.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const currentUser = parseSDK.getCurrentUser();
      if (currentUser) {
        currentUser.set('password', passwordChange.new);
        await currentUser.save();

        setPasswordChange({ current: '', new: '', confirm: '' });
        setShowPasswordForm(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Ошибка смены пароля:', err);
      setError('Ошибка смены пароля. Попробуйте позже.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

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

      {/* Успех */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">Успех</h3>
            <p className="text-green-800 dark:text-green-200 text-sm mt-1">Изменения сохранены успешно</p>
          </div>
        </div>
      )}

      {/* Основные сведения */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User size={24} className="text-indigo-600" />
            Основные сведения
          </h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Редактировать
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Имя пользователя (только для чтения) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Имя пользователя (не может быть изменено)
            </label>
            <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300">
              {settings.username}
            </div>
          </div>

          {/* Email (только для чтения) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email (не может быть изменен)
            </label>
            <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Mail size={16} className="text-gray-500" />
              {settings.email}
            </div>
          </div>

          {/* Полное имя */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Полное имя
            </label>
            {editing ? (
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ваше полное имя"
              />
            ) : (
              <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300">
                {settings.name || '—'}
              </div>
            )}
          </div>

          {/* Имя магазина */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Имя магазина/бренда
            </label>
            {editing ? (
              <input
                type="text"
                value={settings.storeName || ''}
                onChange={(e) => handleInputChange('storeName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Название вашего магазина"
              />
            ) : (
              <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300">
                {settings.storeName || '—'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Информация о магазине */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Building size={24} className="text-indigo-600" />
          Информация о магазине
        </h2>

        <div className="space-y-4">
          {/* Описание магазина */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Описание магазина
            </label>
            {editing ? (
              <textarea
                value={settings.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Опишите ваш магазин..."
                rows={4}
              />
            ) : (
              <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300">
                {settings.description || '—'}
              </div>
            )}
          </div>

          {/* Адрес */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <MapPin size={16} />
              Адрес магазина
            </label>
            {editing ? (
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ваш адрес"
              />
            ) : (
              <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300">
                {settings.address || '—'}
              </div>
            )}
          </div>

          {/* Телефон */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Телефон для связи
            </label>
            {editing ? (
              <input
                type="tel"
                value={settings.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+7 (999) 999-99-99"
              />
            ) : (
              <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300">
                {settings.phone || '—'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Данные для платежей */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <DollarSign size={24} className="text-indigo-600" />
          Реквизиты для платежей
        </h2>

        <div className="space-y-4">
          {/* ИНН */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ИНН (Индивидуальный номер налогоплательщика)
            </label>
            {editing ? (
              <input
                type="text"
                value={settings.taxId || ''}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="12 цифр ИНН"
              />
            ) : (
              <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300">
                {settings.taxId || '—'}
              </div>
            )}
          </div>

          {/* Банковский счет */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Номер банковского счета
            </label>
            {editing ? (
              <input
                type="text"
                value={settings.bankAccount || ''}
                onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="20 цифр номера счета"
              />
            ) : (
              <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300">
                {settings.bankAccount ? `****${settings.bankAccount.slice(-4)}` : '—'}
              </div>
            )}
          </div>

          {editing && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
              ⚠️ Убедитесь, что вы ввели корректные реквизиты. Выплаты будут переводиться на этот счет.
            </div>
          )}
        </div>
      </div>

      {/* Смена пароля */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Lock size={24} className="text-indigo-600" />
          Безопасность
        </h2>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Изменить пароль
          </button>
        ) : (
          <div className="space-y-4">
            {/* Новый пароль */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Новый пароль
              </label>
              <input
                type="password"
                value={passwordChange.new}
                onChange={(e) => setPasswordChange(prev => ({ ...prev, new: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Минимум 6 символов"
              />
            </div>

            {/* Подтверждение пароля */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Подтвердите пароль
              </label>
              <input
                type="password"
                value={passwordChange.confirm}
                onChange={(e) => setPasswordChange(prev => ({ ...prev, confirm: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Повторите пароль"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
              >
                {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordChange({ current: '', new: '', confirm: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Кнопки действия (для редактирования профиля) */}
      {editing && (
        <div className="flex gap-3 sticky bottom-0 bg-white dark:bg-slate-800 p-6 rounded-lg border dark:border-slate-700">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-medium"
          >
            Отмена
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      )}
    </div>
  );
};

// Импорты иконок, которые могут отсутствовать
const CheckCircle = ({ className, size }: { className?: string; size: number }) => (
  <svg size={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2m0 0l4-4m-6 4v1a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" />
  </svg>
);

export default VendorSettings;
