
import React, { useState } from 'react';
import { Star, X, Loader, Upload } from 'lucide-react';
import * as back4app from '../services/back4appRest';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: { id: string; title: string; image?: string };
    orderId: string;
    onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, product, orderId, onSuccess }) => {
    const [rating, setRating] = useState(5);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await back4app.createReview({
                product: product.id,
                order: orderId,
                rating,
                text
            });
            alert('Спасибо за ваш отзыв! Он появится после модерации.');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            // Translate common errors
            if (err.error && err.error.includes('already exists')) {
                setError('Вы уже оставили отзыв на этот товар.');
            } else {
                setError(err.message || 'Ошибка при отправке отзыва');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <X size={24} />
                </button>

                <div className="p-6">
                    <h3 className="text-xl font-bold mb-1 dark:text-white">Оцените товар</h3>
                    <p className="text-sm text-gray-500 mb-6">Ваше мнение поможет другим покупателям</p>

                    <div className="flex items-center gap-4 mb-6 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                        <div className="w-12 h-12 bg-white rounded overflow-hidden flex items-center justify-center border">
                            {product.image ? (
                                <img src={product.image} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs text-gray-400">Нет фото</span>
                            )}
                        </div>
                        <div className="font-medium dark:text-white line-clamp-2">{product.title}</div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Star Rating */}
                        <div className="flex justify-center gap-2 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                >
                                    <Star size={32} fill={star <= rating ? "currentColor" : "none"} />
                                </button>
                            ))}
                        </div>
                        <div className="text-center text-sm font-medium text-gray-500 mb-4">
                            {rating === 5 && 'Отлично!'}
                            {rating === 4 && 'Хорошо'}
                            {rating === 3 && 'Нормально'}
                            {rating === 2 && 'Плохо'}
                            {rating === 1 && 'Ужасно'}
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1 dark:text-gray-300">Комментарий</label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Расскажите подробнее о товаре..."
                                className="w-full p-3 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                required
                                minLength={10}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="animate-spin" /> : 'Отправить отзыв'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
