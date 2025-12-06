
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, Minus, Plus } from 'lucide-react';
import { useMarket } from '../context/MarketContext';

export const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity } = useMarket();
  const navigate = useNavigate();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // Removed automatic 5% discount
  const discount = 0; 
  const shipping = subtotal > 3000 ? 0 : 350;
  const total = subtotal - discount + shipping;

  if (cart.length === 0) {
    return (
        <div className="container mx-auto px-4 py-20 text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🛒</div>
            <h1 className="text-3xl font-bold mb-4 dark:text-white">Корзина пуста</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Посмотрите новинки или воспользуйтесь поиском, чтобы найти что-то интересное.</p>
            <Link to="/catalog" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition">
                Перейти в каталог
            </Link>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Корзина ({cart.length})</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
            {cart.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 flex gap-4 items-center shadow-sm">
                    <img src={item.image} alt={item.title} className="w-20 h-28 object-cover rounded-lg bg-gray-100 dark:bg-slate-700" />
                    
                    <div className="flex-1">
                        <Link to={`/product/${item.id}`} className="font-bold text-lg hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 mb-1 block">{item.title}</Link>
                        {item.author && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{item.author}</p>}
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                             <div className="w-2 h-2 rounded-full bg-green-500"></div> В наличии
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                        <div className="font-bold text-xl dark:text-white">{item.price * item.quantity} ₽</div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex items-center border dark:border-slate-600 rounded-lg h-8 dark:text-white">
                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700"><Minus className="w-3 h-3"/></button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700"><Plus className="w-3 h-3"/></button>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Summary */}
        <div className="w-full lg:w-96">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 shadow-sm sticky top-24">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Ваш заказ</h2>
                
                <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Товары ({cart.reduce((a,c) => a + c.quantity, 0)})</span>
                        <span>{subtotal} ₽</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span>Скидка</span>
                            <span>- {discount} ₽</span>
                        </div>
                    )}
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Доставка</span>
                        <span>{shipping === 0 ? 'Бесплатно' : `${shipping} ₽`}</span>
                    </div>
                </div>

                <div className="border-t dark:border-slate-700 pt-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold dark:text-white">Итого</span>
                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{total} ₽</span>
                    </div>
                    {shipping > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Добавьте товаров на {3000 - subtotal} ₽ для бесплатной доставки</p>
                    )}
                </div>

                <button 
                    onClick={() => navigate('/checkout')}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                    Перейти к оформлению
                </button>
                
                <div className="mt-4 text-center">
                    <input type="text" placeholder="Промокод" className="w-full p-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg mb-2 text-sm"/>
                    <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">Применить промокод</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
    