
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { ProductCard } from '../components/ProductCard';

export const Home: React.FC = () => {
  const { products, isDarkMode } = useMarket();
  
  // Mock selections
  const bestSellers = products.filter(p => p.reviewsCount > 100).sort((a,b) => b.reviewsCount - a.reviewsCount).slice(0, 4);
  const newArrivals = products.filter(p => p.isNew).slice(0, 4);

  return (
    <div className="space-y-12 pb-12 overflow-x-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Hero Banner Section (Family Shopping Style) */}
      <section 
        className={`
            relative overflow-hidden transition-all duration-500 py-12 md:py-24
            ${isDarkMode ? 'bg-[#080011]' : 'bg-gradient-to-r from-sky-100 via-purple-100 to-pink-100'}
        `}
      >
        {/* Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className={`absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[100px] transition-colors duration-500 ${isDarkMode ? 'bg-purple-900/20' : 'bg-blue-200/60'}`}></div>
             <div className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[80px] transition-colors duration-500 ${isDarkMode ? 'bg-indigo-900/20' : 'bg-purple-200/60'}`}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-16">
                
                {/* Image Side */}
                <div className="flex-1 w-full relative group perspective-1000">
                     <div className="relative transform transition-transform duration-700 md:group-hover:rotate-y-1 md:group-hover:rotate-x-1">
                        {/* Main Image */}
                        <img 
                            src="https://images.unsplash.com/photo-1616400619175-5beda3a17896?auto=format&fit=crop&w=1600&q=80" 
                            alt="Радость шопинга онлайн через смартфон" 
                            className="w-full h-auto rounded-3xl shadow-2xl object-cover relative z-10 border-4 border-white/50 dark:border-white/10 aspect-[4/3]"
                        />
                     </div>
                </div>

                {/* Text Side */}
                <div className="flex-1 text-center md:text-right">
                    <h1 className={`text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-[#4c1d95]'}`}>
                        РАДОСТЬ <br/>
                        ШОПИНГА <br/>
                        ОНЛАЙН!!
                    </h1>
                    
                    <p className={`text-lg md:text-2xl font-medium mb-10 ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                        Тысячи товаров. Быстрая доставка.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-end">
                        <Link 
                            to="/catalog" 
                            className="px-12 py-4 bg-[#6d28d9] text-white text-lg font-bold rounded-full shadow-lg hover:bg-[#5b21b6] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            КАТАЛОГ
                        </Link>
                    </div>
                </div>

            </div>
        </div>
      </section>

      {/* Categories CTA Section Removed */}

      {/* Best Sellers */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Хиты продаж</h2>
             <Link to="/catalog" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center">Смотреть все <ArrowRight className="w-4 h-4 ml-1"/></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {bestSellers.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="mb-6 md:mb-0 max-w-xl relative z-10">
                  <div className="text-yellow-300 font-bold mb-2">ТОЛЬКО СЕГОДНЯ</div>
                  <h3 className="text-3xl font-bold mb-4">Черная Пятница началась!</h3>
                  <p className="text-indigo-100 mb-6">Скидки до 70% на электронику и одежду. Успейте купить лучшие товары по сниженным ценам.</p>
                  <Link to="/catalog" className="inline-block px-8 py-3 bg-white text-indigo-900 font-bold rounded-full hover:bg-gray-50 hover:scale-105 transition shadow-lg">Перейти к распродаже</Link>
              </div>
              <div className="text-9xl relative z-10 transform rotate-12 drop-shadow-lg">🛍️</div>
          </div>
      </section>

      {/* New Arrivals */}
      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Новинки</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {newArrivals.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
      </section>
    </div>
  );
};
