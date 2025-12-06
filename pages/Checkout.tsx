
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import { ABKHAZIA_CITIES } from '../constants';
import { CreditCard, Banknote, Truck, CheckCircle } from 'lucide-react';
import { OrderDetails } from '../types';

export const Checkout: React.FC = () => {
  const { cart, user, addOrder, clearCart } = useMarket();
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'success'>('form');

  // Form State
  const [formData, setFormData] = useState({
    firstName: user?.name.split(' ')[0] || '',
    lastName: user?.name.split(' ')[1] || '',
    phone: '',
    city: 'Сухум',
    address: '',
    comment: '',
    paymentMethod: 'cash' as 'cash' | 'card'
  });

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryPrice = formData.city === 'Сухум' ? 200 : 400;
  const total = subtotal + deliveryPrice;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create actual order object
    const newOrder: OrderDetails = {
        id: `ORD-${Math.floor(Math.random() * 100000)}`,
        items: [...cart],
        total,
        customerName: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        paymentMethod: formData.paymentMethod,
        status: 'new',
        date: new Date().toISOString().split('T')[0],
        userId: user?.id
    };

    // Simulate API call delay
    setTimeout(() => {
      addOrder(newOrder); // Add to global state
      clearCart();
      setStep('success');
    }, 1500);
  };

  if (cart.length === 0 && step === 'form') {
    return (
      <div className="container mx-auto px-4 py-20 text-center dark:text-white">
        <h2 className="text-2xl font-bold mb-4">Корзина пуста</h2>
        <button onClick={() => navigate('/catalog')} className="text-indigo-600 hover:underline">Вернуться в каталог</button>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center justify-center min-h-[60vh] dark:text-white">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Спасибо за заказ!</h1>
        <p className="text-gray-500 dark:text-gray-300 max-w-md mb-8">
          Ваш заказ успешно оформлен. Менеджер увидит его в Админ-панели.
          Мы свяжемся с вами по номеру {formData.phone} для подтверждения доставки в г. {formData.city}.
        </p>
        <button 
          onClick={() => { navigate('/'); }}
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
        >
          Продолжить покупки
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Оформление заказа</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form id="checkout-form" onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 space-y-6">
            
            {/* Contact Info */}
            <div>
              <h2 className="text-xl font-bold mb-4 dark:text-white">Контактные данные</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя</label>
                  <input 
                    type="text" name="firstName" required
                    className="w-full p-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={formData.firstName} onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Фамилия</label>
                  <input 
                    type="text" name="lastName" required
                    className="w-full p-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={formData.lastName} onChange={handleInputChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Телефон (Абхазия/РФ)</label>
                  <input 
                    type="tel" name="phone" placeholder="+7 940 ..." required
                    className="w-full p-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={formData.phone} onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="border-t dark:border-slate-700 pt-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5"/> Доставка
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Город</label>
                  <select 
                    name="city" 
                    className="w-full p-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={formData.city} onChange={handleInputChange}
                  >
                    {ABKHAZIA_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Адрес доставки (Улица, Дом, Кв)</label>
                  <input 
                    type="text" name="address" required
                    className="w-full p-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={formData.address} onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Комментарий к заказу</label>
                  <textarea 
                    name="comment" rows={2}
                    className="w-full p-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={formData.comment} onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="border-t dark:border-slate-700 pt-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5"/> Оплата
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`border rounded-lg p-4 cursor-pointer transition flex items-center gap-3 ${formData.paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400' : 'border-gray-200 dark:border-slate-600'}`}>
                  <input 
                    type="radio" name="paymentMethod" value="cash" 
                    className="accent-indigo-600"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={handleInputChange}
                  />
                  <div>
                    <div className="font-bold dark:text-white">Наличными</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Курьеру при получении</div>
                  </div>
                </label>
                
                <label className={`border rounded-lg p-4 cursor-pointer transition flex items-center gap-3 ${formData.paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400' : 'border-gray-200 dark:border-slate-600'}`}>
                  <input 
                    type="radio" name="paymentMethod" value="card" 
                    className="accent-indigo-600"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleInputChange}
                  />
                  <div>
                    <div className="font-bold dark:text-white">Картой онлайн</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Visa, MasterCard, Мир</div>
                  </div>
                  <CreditCard className="w-5 h-5 ml-auto text-gray-400"/>
                </label>
              </div>
            </div>

          </form>
        </div>

        {/* Summary Side */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 sticky top-24">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Ваш заказ</h3>
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3">
                  <img src={item.image} alt="" className="w-12 h-16 object-cover rounded bg-gray-100" />
                  <div className="flex-1">
                    <div className="text-sm font-medium line-clamp-2 dark:text-white">{item.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.quantity} шт × {item.price} ₽</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t dark:border-slate-700 pt-4 space-y-2 text-sm">
              <div className="flex justify-between dark:text-gray-300">
                <span>Товары</span>
                <span>{subtotal} ₽</span>
              </div>
              <div className="flex justify-between dark:text-gray-300">
                <span>Доставка ({formData.city})</span>
                <span>{deliveryPrice} ₽</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-slate-700 dark:text-white">
                <span>Итого</span>
                <span className="text-indigo-600 dark:text-indigo-400">{total} ₽</span>
              </div>
            </div>

            <button 
              form="checkout-form"
              type="submit"
              className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              Подтвердить заказ
            </button>
            <p className="text-xs text-center text-gray-400 mt-3">
              Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
