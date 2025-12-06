
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Check, Info } from 'lucide-react';
import { Product } from '../types';
import { useMarket } from '../context/MarketContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, toggleFavorite, favorites, getVendorById } = useMarket();
  const isFavorite = favorites.includes(product.id);
  const [isAdded, setIsAdded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const vendorName = product.vendorId ? getVendorById(product.vendorId)?.name : product.author;
  
  // Calculate discount percentage
  const discountPercent = product.oldPrice && product.price < product.oldPrice 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent flip when clicking button
      addToCart(product);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
  };

  const handleFlip = () => {
      setIsFlipped(!isFlipped);
  };

  return (
    <div 
        className="group relative w-full h-[340px] sm:h-[420px] cursor-pointer perspective-1000"
        onClick={handleFlip}
    >
        <div 
            className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
        >
            {/* FRONT SIDE */}
            <div className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-slate-900/50 backface-hidden overflow-hidden border border-gray-100 dark:border-slate-700 flex flex-col">
                {/* Image */}
                <div className="h-[170px] sm:h-[240px] w-full relative overflow-hidden bg-gray-100 dark:bg-slate-700">
                    <img 
                        src={product.image} 
                        alt={product.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Discount Badge - Red Square */}
                    {discountPercent > 0 && (
                        <div className="absolute bottom-0 left-0 bg-red-600 text-white w-10 h-10 flex items-center justify-center font-bold text-xs shadow-md z-10">
                            -{discountPercent}%
                        </div>
                    )}
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                        className={`absolute top-2 right-2 p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm hover:scale-110 transition ${isFavorite ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    {/* Hint to flip */}
                    <div className="absolute top-2 left-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition">
                        <Info className="w-4 h-4" />
                    </div>
                </div>

                {/* Info */}
                <div className="p-3 sm:p-4 flex flex-col flex-1">
                    <div className="mb-1 sm:mb-2">
                        <div className="flex items-baseline gap-2">
                            <span className={`text-lg sm:text-xl font-bold ${discountPercent > 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                                {product.price} ₽
                            </span>
                            {product.oldPrice && (
                                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                                    {product.oldPrice} ₽
                                </span>
                            )}
                        </div>
                        <h3 className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 line-clamp-2 leading-relaxed h-[32px] sm:h-[40px]">{product.title}</h3>
                        
                        {/* Vendor Link */}
                        {product.vendorId && (
                            <Link 
                                to={`/vendor-page/${product.vendorId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-indigo-500 hover:underline block mt-1 truncate"
                            >
                                {vendorName}
                            </Link>
                        )}
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1 text-yellow-400 text-[10px] sm:text-xs font-bold">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current"/>
                            <span>{product.rating}</span>
                            <span className="text-gray-400 font-normal ml-1">({product.reviewsCount})</span>
                        </div>
                    </div>
                    
                    <button 
                         onClick={handleAddToCart}
                         disabled={isAdded}
                         className={`mt-2 sm:mt-3 w-full py-2 sm:py-2.5 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm
                             ${isAdded 
                                ? 'bg-green-500 text-white scale-95' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                             }`}
                     >
                        {isAdded ? (
                            <>
                                <Check className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">В корзине</span>
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" /> В корзину
                            </>
                        )}
                     </button>
                </div>
            </div>

            {/* BACK SIDE */}
            <div className="absolute inset-0 w-full h-full bg-slate-900 text-white rounded-2xl shadow-xl backface-hidden rotate-y-180 p-4 sm:p-6 flex flex-col justify-between overflow-hidden border border-slate-700">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                    <h3 className="text-base sm:text-lg font-bold mb-1 leading-tight line-clamp-2">{product.title}</h3>
                    
                    {product.vendorId && (
                         <Link 
                            to={`/vendor-page/${product.vendorId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] sm:text-xs text-indigo-300 mb-2 sm:mb-4 block hover:text-white"
                        >
                            Продавец: {vendorName}
                        </Link>
                    )}
                    
                    <div className="h-[1px] w-full bg-slate-700 mb-2 sm:mb-4"></div>
                    
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-2 sm:mb-4 line-clamp-4 sm:line-clamp-none">
                        {product.description.length > 120 ? product.description.slice(0, 120) + '...' : product.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-4">
                        {product.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-slate-800 rounded text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 space-y-2 sm:space-y-3">
                    <Link 
                        to={`/product/${product.id}`}
                        onClick={(e) => e.stopPropagation()} 
                        className="block w-full py-2 sm:py-2.5 text-center bg-white/10 hover:bg-white/20 rounded-xl text-xs sm:text-sm font-medium transition"
                    >
                        Подробнее
                    </Link>
                    <button 
                         onClick={handleAddToCart}
                         disabled={isAdded}
                         className={`w-full py-2 sm:py-2.5 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm
                             ${isAdded 
                                ? 'bg-green-500 text-white' 
                                : 'bg-white text-slate-900 hover:bg-indigo-50'
                             }`}
                     >
                        {isAdded ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />}
                        {isAdded ? 'Добавлено' : 'В корзину'}
                     </button>
                </div>
            </div>
        </div>
    </div>
  );
};
