
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Truck, ShieldCheck, Heart, ShoppingCart, Minus, Plus, Check, MessageSquare } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { ProductCard } from '../components/ProductCard';
import * as back4app from '../services/back4appRest';

export const ProductDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { products, addToCart, cart, updateQuantity, toggleFavorite, favorites, user, getVendorById, appealReview } = useMarket();
    const product = products.find(p => p.id === id);
    const [isAdded, setIsAdded] = useState(false);

    const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');
    const [dbReviews, setDbReviews] = useState<any[]>([]);

    useEffect(() => {
        if (product?.id) {
            back4app.getReviews({ product: product.id }).then(res => {
                if (res && Array.isArray(res)) setDbReviews(res);
                else if (res && res.results) setDbReviews(res.results);
            }).catch(err => console.error("Failed to load reviews:", err));
        }
    }, [product?.id]);

    if (!product) {
        return <div className="p-12 text-center dark:text-white">Товар не найден</div>;
    }

    const isFavorite = favorites.includes(product.id);
    const cartItem = cart.find(i => i.id === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const vendor = product.vendorId ? getVendorById(product.vendorId) : undefined;
    const vendorName = vendor?.name || product.author;

    // Use DB reviews
    const productReviews = dbReviews;

    const handleAddToCart = () => {
        addToCart(product);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);
    };

    const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Product Main Section */}
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
                {/* Gallery */}
                <div className="space-y-4">
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800 border dark:border-slate-700 shadow-sm">
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                    </div>
                </div>

                {/* Info */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating) ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                            ))}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{productReviews.length} отзыва</span>
                        <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Артикул: {product.id}0023</span>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{product.title}</h1>

                    {product.vendorId ? (
                        <Link to={`/vendor-page/${product.vendorId}`} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline mb-4 block flex items-center gap-2 w-fit">
                            <span className="bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md text-sm">Продавец: {vendorName}</span>
                        </Link>
                    ) : (
                        <span className="text-gray-500 mb-4 block">{vendorName}</span>
                    )}

                    <div className="flex items-end gap-4 mb-8">
                        <span className="text-4xl font-bold text-slate-900 dark:text-white">{product.price} ₽</span>
                        {product.oldPrice && (
                            <div className="mb-2">
                                <span className="text-lg text-gray-400 line-through mr-2">{product.oldPrice} ₽</span>
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">-20%</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        {quantity > 0 && !isAdded ? (
                            <div className="flex items-center border border-gray-300 dark:border-slate-600 rounded-xl h-12 w-full sm:w-40 dark:text-white">
                                <button onClick={() => updateQuantity(product.id, quantity - 1)} className="w-12 h-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700"><Minus className="w-4 h-4" /></button>
                                <span className="flex-1 text-center font-bold">{quantity}</span>
                                <button onClick={() => updateQuantity(product.id, quantity + 1)} className="w-12 h-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700"><Plus className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <button
                                onClick={handleAddToCart}
                                disabled={isAdded}
                                className={`flex-1 font-bold h-12 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform
                            ${isAdded ? 'bg-green-600 text-white scale-105' : 'bg-indigo-600 text-white hover:bg-indigo-700'}
                        `}
                            >
                                {isAdded ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Добавлено
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-5 h-5" />
                                        Добавить в корзину
                                    </>
                                )}
                            </button>
                        )}
                        <button
                            onClick={() => toggleFavorite(product.id)}
                            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition ${isFavorite ? 'border-red-500 text-red-500 bg-red-50' : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 dark:text-white'}`}
                        >
                            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                    </div>

                    {/* Benefits */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-8">
                        <div className="flex items-center gap-2">
                            <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <span>Доставка завтра</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <span>Гарантия качества</span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
                        <div className="flex gap-8">
                            <button
                                className={`pb-4 font-medium transition ${activeTab === 'desc' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                                onClick={() => setActiveTab('desc')}
                            >
                                Описание
                            </button>
                            <button
                                className={`pb-4 font-medium transition ${activeTab === 'reviews' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                                onClick={() => setActiveTab('reviews')}
                            >
                                Отзывы ({productReviews.length})
                            </button>
                        </div>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                        {activeTab === 'desc' ? (
                            <div>
                                <p className="mb-4">{product.description}</p>
                                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Характеристики</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Бренд: {vendorName}</li>
                                    <li>Категория: {product.category}</li>
                                    <li>Состояние: {product.isNew ? 'Новое' : 'Стандарт'}</li>
                                </ul>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Info Block: How to Review */}
                                <div className="bg-indigo-50 dark:bg-slate-800 p-6 rounded-xl border border-indigo-100 dark:border-slate-700">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5" /> Как оставить отзыв?
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        Мы публикуем только честные отзывы от реальных покупателей.
                                        Оставить отзыв можно в личном кабинете после получения заказа.
                                    </p>
                                    <Link to="/profile" className="text-indigo-600 font-bold hover:underline">Перейти в Мои Заказы</Link>
                                </div>

                                {/* Reviews List */}
                                <div className="space-y-6">
                                    {productReviews.length > 0 ? productReviews.map(review => (
                                        <div key={review.id || review.objectId} className="border-b dark:border-slate-700 pb-6 last:border-0 animate-fade-in">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-indigo-100 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-white uppercase">
                                                    {(review.userName || 'U')[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{review.userName || 'Покупатель'}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Недавно'}
                                                    </div>
                                                </div>
                                                <div className="ml-auto flex text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 px-2 py-1 rounded-full">
                                                    {[...Array(5)].map((_, j) => (
                                                        <Star key={j} className={`w-3 h-3 ${j < (review.rating || 5) ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300">{review.text || review.comment}</p>
                                            <div className="mt-3 flex gap-2">
                                                {user && user.id !== review.userId && (
                                                    <button
                                                        onClick={() => {
                                                            const reason = prompt('Причина обращения (опишите нарушение):');
                                                            if (!reason) return;
                                                            if (appealReview) {
                                                                const ok = appealReview(review.id || review.objectId, reason);
                                                                if (ok) alert('Жалоба отправлена на модерацию');
                                                            }
                                                        }}
                                                        className="text-sm px-3 py-1 border rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                                                    >
                                                        Обжаловать
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-gray-500 italic">Пока нет отзывов. Будьте первым!</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <section>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">Похожие товары</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                    {relatedProducts.map(p => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </section>
        </div>
    );
};
