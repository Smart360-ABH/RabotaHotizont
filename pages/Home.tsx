
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { ProductCard } from '../components/ProductCard';
import { PromoSlider } from '../components/PromoSlider';

export const Home: React.FC = () => {
    const { products, isDarkMode } = useMarket();

    // Mock selections
    const bestSellers = products.filter(p => p.reviewsCount > 100).sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 4);
    const newArrivals = products.filter(p => p.isNew).slice(0, 4);

    return (
        <div className="space-y-12 pb-12 overflow-x-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            {/* Hero Banner Section (Promo Slider) */}
            <section className="mb-8">
                <PromoSlider />
            </section>

            {/* Product Feed */}
            <section className="container mx-auto px-4 pb-8">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Рекомендации для вас</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                    {products.map(product => (
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


        </div>
    );
};
