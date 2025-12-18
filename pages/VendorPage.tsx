
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
    const [isMessageModalOpen, setIsMessageModalOpen] = React.useState(false);
    const [messageText, setMessageText] = React.useState('');

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
                const u = await back4app.getUserById(id);

                // Handle both Parse object and plain JSON responses
                const role = typeof u.get === 'function' ? u.get('role') : u.role;
                const objectId = u.id || u.objectId;
                const username = typeof u.get === 'function' ? u.get('username') : u.username;
                const companyName = typeof u.get === 'function' ? u.get('companyName') : u.companyName;
                const description = typeof u.get === 'function' ? u.get('description') : u.description;
                const avatar = typeof u.get === 'function' ? u.get('avatar') : u.avatar;
                const coverImage = typeof u.get === 'function' ? u.get('coverImage') : u.coverImage;

                if (u && role === 'vendor') {
                    setLocalVendor({
                        id: objectId,
                        name: companyName || username || 'Unknown Vendor',
                        description: description || `Магазин ${username}`,
                        image: avatar?.url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=80',
                        coverImage: coverImage?.url,
                        rating: 5.0,
                        joinedDate: u.createdAt,
                        status: 'active',
                        vendorId: objectId,
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

    const handleSubscribe = async () => {
        if (!vendor) return;

        const isCurrentlySubscribed = followedVendors.includes(vendor.id);
        toggleFollowVendor(vendor.id);

        if (!isCurrentlySubscribed) {
            // Request notification permission if not already granted
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    new Notification(`Вы подписались на ${vendor.name}`, {
                        body: 'Теперь вы будете получать уведомления о новых товарах и скидках этого продавца.',
                        icon: vendor.image
                    });
                }
            } else {
                alert(`Вы подписались на ${vendor.name}!`);
            }
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        console.log('[VendorPage] Attempting to send message...');

        try {
            if (user && vendor) {
                const currentUserId = user.id || user.objectId;
                const targetUserId = vendor.vendorId;

                console.log('[VendorPage] Creating conversation between:', currentUserId, 'and', targetUserId);

                // 1. Create or get existing conversation
                const conv = await back4app.createConversation('pre_sales', [currentUserId, targetUserId], { productId: 'general' });
                console.log('[VendorPage] Conversation response:', conv);

                if (conv && (conv.objectId || conv.id)) {
                    const convId = conv.objectId || conv.id;
                    // 2. Send the message
                    console.log('[VendorPage] Sending message to conversation:', convId);
                    await back4app.sendMessage(convId, messageText);
                    console.log('[VendorPage] Message sent successfully');

                    setIsMessageModalOpen(false);
                    setMessageText('');
                    alert('Сообщение успешно отправлено!');
                } else {
                    throw new Error('Не удалось создать или найти беседу');
                }
            } else {
                throw new Error('Пользователь или продавец не определены');
            }
        } catch (e: any) {
            console.error('[VendorPage] Error in handleSendMessage:', e);
            alert(`Ошибка при отправке сообщения: ${e.message || 'Неизвестная ошибка'}`);
        }
    };

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
                            onClick={handleSubscribe}
                            className={`px-6 py-3 font-bold rounded-xl transition shadow-lg ${vendor && followedVendors.includes(vendor.id)
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-200 dark:shadow-none'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
                                }`}
                        >
                            {vendor && followedVendors.includes(vendor.id) ? 'Вы подписаны' : 'Подписаться'}
                        </button>
                        <button
                            onClick={() => {
                                console.log('[VendorPage] Message button clicked');
                                console.log('[VendorPage] Current User:', user);
                                console.log('[VendorPage] Current Vendor:', vendor);

                                if (!user) {
                                    alert('Пожалуйста, войдите в систему, чтобы написать продавцу.');
                                    return;
                                }
                                const currentUserId = user.id || user.objectId;
                                console.log('[VendorPage] Comparing currentUserId:', currentUserId, 'with vendor.id:', vendor?.id);

                                if (vendor && currentUserId === vendor.id) {
                                    alert('Вы не можете написать самому себе.');
                                    return;
                                }
                                setIsMessageModalOpen(true);
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

            {/* Message Modal */}
            {isMessageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold dark:text-white">Написать сообщение</h3>
                            <button
                                onClick={() => setIsMessageModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">Получатель: <span className="font-semibold text-gray-900 dark:text-white">{vendor.name}</span></p>
                            <textarea
                                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white h-32 resize-none"
                                placeholder="Введите ваше сообщение..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsMessageModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-lg transition"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleSendMessage}
                                disabled={!messageText.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Отправить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
