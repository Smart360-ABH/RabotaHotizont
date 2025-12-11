
import React from 'react';
import { useParams } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import { ProductCard } from '../components/ProductCard';
import { Star, MapPin, Calendar, Verified, ShieldCheck } from 'lucide-react';
import * as back4app from '../services/back4appRest';

export const VendorPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { products, getVendorById, users, followedVendors, toggleFollowVendor, user } = useMarket(); // destructured users, followedVendors, toggleFollowVendor, user

    // Try to find in official vendors list
    const contextVendor = id ? getVendorById(id) : undefined;

    const [localVendor, setLocalVendor] = React.useState<any | undefined>(undefined);
    const [isLoading, setIsLoading] = React.useState(false);

    // Fallback: Check if it's a User ID that just has role='vendor' but not fully registered in MOCK data
    // OR fetch from server if not found in context at all
    React.useEffect(() => {
        if (contextVendor) return; // already have it
        if (!id) return;

        // Try to find in existing users list (fastest fallback)
        const userVendor = users.find(u => u.id === id || u.vendorId === id);
        if (userVendor) {
            setLocalVendor({
                id: userVendor.id,
                name: userVendor.name,
                description: 'Пользователь-продавец',
                image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=80',
                rating: 5.0,
                joinedDate: new Date().toISOString(),
                status: 'active',
                vendorId: userVendor.id,
                revenue: 0
            });
            return;
        }

        // If not in context OR users list, fetch from server (Fetch-on-Demand)
        const fetchVendor = async () => {
            setIsLoading(true);
            try {
                // Try fetching as User first (since vendors are Users with role='vendor')
                // Note: getUserById in back4appRest typically fetches _User class
                const u = await back4app.getUserById(id);
                if (u && (u.role === 'vendor' || u.get('role') === 'vendor')) {
                    setLocalVendor({
                        id: u.id || u.objectId,
                        name: u.get('companyName') || u.get('username') || 'Unknown Vendor',
                        description: u.get('description') || `Магазин ${u.get('username')}`,
                        image: u.get('avatar')?.url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=80',
                        coverImage: u.get('coverImage')?.url,
                        rating: 5.0,
                        joinedDate: u.createdAt,
                        status: 'active',
                        vendorId: u.id || u.objectId,
                        revenue: 0
                    });
                }
            } catch (e) {
                console.warn('Vendor not found on server:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchVendor();
    }, [id, contextVendor, users]);

    const vendor = contextVendor || localVendor;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-gray-400 mb-2">Продавец не найден</h2>
                    <p className="text-gray-500">Возможно, ссылка неактуальна или продавец больше не торгует.</p>
                </div>
            </div>
        );
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
                        <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover" />
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
                        <button
                            onClick={() => vendor && toggleFollowVendor(vendor.id)}
                            className={`px-6 py-3 font-bold rounded-xl transition shadow-lg ${vendor && followedVendors.includes(vendor.id)
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-200 dark:shadow-none'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
                                }`}
                        >
                            {vendor && followedVendors.includes(vendor.id) ? 'Вы подписаны' : 'Подписаться'}
                        </button>
                        <button
                            onClick={async () => {
                                if (!user) {
                                    alert('Пожалуйста, войдите в систему, чтобы написать продавцу.');
                                    return;
                                }
                                if (vendor && user.id === vendor.vendorId) {
                                    alert('Вы не можете написать самому себе.');
                                    return;
                                }
                                if (vendor) {
                                    try {
                                        // Call backend to create conversation
                                        // Ensure we pass the backend User IDs (not our local mocks if they differ, but we are mapping correctly now)
                                        // The context maps `user.id` to `objectId`.
                                        await back4app.createConversation([user.id, vendor.vendorId], { type: 'pre_sales' });
                                        alert('Чат создан! (Переход в чат скоро заработает)');
                                    } catch (e) {
                                        console.error(e);
                                        alert('Ошибка при создании чата');
                                    }
                                }
                            }}
                            className="px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                        >
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
