
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { ProductCard } from '../components/ProductCard';

export const Favorites: React.FC = () => {
  const { products, favorites } = useMarket();

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-white transition">
              <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold dark:text-white">Избранное ({favoriteProducts.length})</h1>
      </div>

      {favoriteProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {favoriteProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 text-center shadow-sm">
            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-10 h-10 text-red-500 fill-current opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">В избранном пусто</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8">
                Жмите на сердечко на карточке товара, чтобы добавить его сюда.
            </p>
            <Link 
                to="/catalog"
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold"
            >
                Перейти к покупкам
            </Link>
        </div>
      )}
    </div>
  );
};
