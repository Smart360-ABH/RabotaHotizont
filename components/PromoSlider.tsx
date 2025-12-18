import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const banners = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?q=80&w=3270&auto=format&fit=crop', // Big sale/Holiday
        title: 'Зимняя распродажа',
        subtitle: 'Скидки до 70%',
        color: 'from-purple-600 to-indigo-600',
        link: '/catalog?tag=sale'
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=3270&auto=format&fit=crop', // Shoes/Sneakers
        title: 'Новая коллекция',
        subtitle: 'Стиль и комфорт',
        color: 'from-red-500 to-orange-500',
        link: '/catalog?category=shoes'
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=3271&auto=format&fit=crop', // Laptop/Tech
        title: 'Техника для дома',
        subtitle: 'Обновите свои гаджеты',
        color: 'from-blue-500 to-cyan-500',
        link: '/catalog?category=electronics'
    },
    {
        id: 4,
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?q=80&w=3270&auto=format&fit=crop', // Cosmetics
        title: 'Красота и уход',
        subtitle: 'Лучшие бренды',
        color: 'from-pink-500 to-rose-500',
        link: '/catalog?category=beauty'
    },
    {
        id: 5,
        image: 'https://images.unsplash.com/photo-1609339655513-e48f76dfd224?q=80&w=3270&auto=format&fit=crop', // New Year Decor
        title: 'Готовимся к праздникам',
        subtitle: 'Всё для уюта',
        color: 'from-emerald-500 to-teal-500',
        link: '/catalog?tag=newyear'
    }
];

export const PromoSlider: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const sliderRef = useRef<HTMLDivElement>(null);
    const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    const resetAutoScroll = () => {
        if (autoScrollRef.current) {
            clearInterval(autoScrollRef.current);
        }
        autoScrollRef.current = setInterval(nextSlide, 5000);
    };

    useEffect(() => {
        resetAutoScroll();
        return () => {
            if (autoScrollRef.current) clearInterval(autoScrollRef.current);
        };
    }, []);

    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
        resetAutoScroll();
    };

    // Swipe support (basic)
    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) nextSlide();
            else prevSlide();
            resetAutoScroll();
        }
    };

    return (
        <div className="w-full relative overflow-hidden py-8 group">

            {/* Background Blur Effect based on current slide */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 transition-colors duration-500 -z-10"></div>

            <div
                className="flex items-center justify-center transition-transform duration-500 ease-in-out"
                style={{
                    // This logic centers the current slide and shows parts of prev/next
                    // We want the current slide to be centered.
                    // transform: `translateX(calc(-${currentIndex * 100}% + (100% - 80%) / 2))` inside a container?
                    // Better approach: just render the slides and calculate offset
                    // Let's rely on standard centering and relative positioning
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* 
                Container for slides. 
                We use a fixed height.
                We translate based on index.
                Each slide takes up e.g. 70-80% of width on desktop.
             */}
                <div className="w-full relative h-[300px] md:h-[400px] max-w-[1400px] mx-auto overflow-hidden">
                    <div
                        className="flex h-full transition-transform duration-500 ease-out"
                        style={{
                            transform: `translateX(calc(-${currentIndex * 100}%))`
                        }}
                    >
                        {banners.map((banner, index) => (
                            <div
                                key={banner.id}
                                className="w-full h-full flex-shrink-0 px-2 md:px-4 relative"
                            >
                                <Link to={banner.link} className="block w-full h-full relative rounded-3xl overflow-hidden shadow-xl group/slide">
                                    {/* Image */}
                                    <img
                                        src={banner.image}
                                        alt={banner.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover/slide:scale-105"
                                    />

                                    {/* Gradient Overlay */}
                                    <div className={`absolute inset-0 bg-gradient-to-r ${banner.color} opacity-20 mixed-blend-overlay`}></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                                    {/* Content */}
                                    <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full text-white">
                                        <h2 className="text-3xl md:text-5xl font-black mb-2 drop-shadow-lg transform transition-transform duration-500 translate-y-0 group-hover/slide:-translate-y-2">{banner.title}</h2>
                                        <p className="text-lg md:text-xl font-medium text-white/90 mb-4">{banner.subtitle}</p>
                                        <span className="inline-block px-6 py-2 bg-white text-black font-bold rounded-full text-sm md:text-base opacity-0 group-hover/slide:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover/slide:translate-y-0">
                                            Смотреть
                                        </span>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={() => { prevSlide(); resetAutoScroll(); }}
                className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-md text-white p-3 rounded-full shadow-lg z-10 transition-all hover:scale-110 disabled:opacity-50 hidden md:flex"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            <button
                onClick={() => { nextSlide(); resetAutoScroll(); }}
                className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-md text-white p-3 rounded-full shadow-lg z-10 transition-all hover:scale-110 hidden md:flex"
                aria-label="Next slide"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => handleDotClick(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'w-8 bg-white'
                                : 'bg-white/50 hover:bg-white/80'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};
