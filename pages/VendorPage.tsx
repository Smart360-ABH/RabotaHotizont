
import React from 'react';
import { useParams } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import { ProductCard } from '../components/ProductCard';
import { Star, MapPin, Calendar, Verified, ShieldCheck } from 'lucide-react';

export const VendorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products, getVendorById } = useMarket();
  
  const vendor = id ? getVendorById(id) : undefined;
  
  if (!vendor) {
      return <div className="p-12 text-center dark:text-white">Продавец не найден</div>;
  }

  const vendorProducts = products.filter(p => p.vendorId === vendor.id);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
       {/* Cover Image */}
       <div className="h-64 md:h-80 w-full overflow-hidden relative">
           <img 
              src={vendor.coverImage || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1600&q=80'} 
              alt="Cover" 
              className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
       </div>

       <div className="container mx-auto px-4 relative z-10 -mt-20">
           {/* Vendor Card */}
           <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-xl border dark:border-slate-700 flex flex-col md:flex-row gap-6 md:items-start mb-12">
               <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-slate-800 shadow-md overflow-hidden bg-white shrink-0">
                   <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover"/>
               </div>
               
               <div className="flex-1 pt-2">
                   <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                       <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">
                           {vendor.name} 
                           <Verified className="w-6 h-6 text-blue-500" />
                       </h1>
                       <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold inline-block w-fit">
                           Официальный партнер
                       </span>
                   </div>
                   
                   <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl">{vendor.description}</p>
                   
                   <div className="flex flex-wrap gap-4 md:gap-8 text-sm text-gray-500 dark:text-gray-400">
                       <div className="flex items-center gap-2">
                           <Star className="w-5 h-5 text-yellow-400 fill-current" />
                           <span className="font-bold text-slate-900 dark:text-white text-lg">{vendor.rating}</span>
                           <span>Рейтинг</span>
                       </div>
                       <div className="flex items-center gap-2">
                           <ShieldCheck className="w-5 h-5 text-indigo-500" />
                           <span>Проверенный продавец</span>
                       </div>
                       <div className="flex items-center gap-2">
                           <Calendar className="w-5 h-5" />
                           <span>На Горизонте с {new Date(vendor.joinedDate).toLocaleDateString('ru-RU')}</span>
                       </div>
                   </div>
               </div>

               <div className="flex flex-col gap-3 min-w-[200px]">
                   <button className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none">
                       Подписаться
                   </button>
                   <button className="px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                       Написать
                   </button>
               </div>
           </div>

           {/* Products Section */}
           <div className="mb-12">
               <h2 className="text-2xl font-bold dark:text-white mb-6 flex items-center gap-3">
                   Товары продавца 
                   <span className="text-gray-400 text-lg font-normal">({vendorProducts.length})</span>
               </h2>
               
               {vendorProducts.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {vendorProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
               ) : (
                    <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
                        <p className="text-gray-500">У продавца пока нет активных товаров.</p>
                    </div>
               )}
           </div>
       </div>
    </div>
  );
};
