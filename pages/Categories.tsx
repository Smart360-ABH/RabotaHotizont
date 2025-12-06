
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shirt, Monitor, Sofa, Coffee, Dumbbell, Car, Sparkles, BookOpen, 
  Gamepad2, Footprints, Watch, Briefcase, Baby, Heart, PenTool, 
  Hammer, Flower2, Plane, Gift, ShieldPlus
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';

export const Categories: React.FC = () => {
  const { isDarkMode } = useMarket();

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-4 text-slate-900 dark:text-white">Все категории</h1>
        <p className="text-lg text-slate-600 dark:text-gray-400">Выберите раздел для быстрого перехода</p>
      </div>
      
      <div className="keyboard-menu-wrapper flex justify-center items-center py-4">
        <style>{`
          .keyboard-menu-wrapper {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
          }

          /* Base Key Style */
          .key-btn {
            position: relative;
            width: 140px;
            height: 120px;
            background: #f1f5f9; /* Slate-100 */
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: #475569;
            font-weight: bold;
            transition: all 0.1s ease;
            cursor: pointer;
            
            /* 3D Side & Shadow Construction */
            box-shadow: 
              0 8px 0 #cbd5e1, /* The physical side of the key */
              0 12px 15px rgba(0,0,0,0.1), /* Drop shadow */
              inset 0 4px 5px rgba(255,255,255,0.9); /* Top highlight */
            border: 1px solid rgba(255,255,255,0.5);
            text-align: center;
          }

          .key-btn span {
             margin-top: 8px;
             font-size: 13px;
             line-height: 1.2;
          }

          /* Dark Mode Support via parent class */
          .dark .key-btn {
            background: #1e293b;
            color: #94a3b8;
            box-shadow: 
              0 8px 0 #0f172a, /* Dark side */
              0 12px 20px rgba(0,0,0,0.5),
              inset 0 2px 2px rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.05);
          }

          /* Hover State (Light Up) */
          .key-btn:hover {
            transform: translateY(4px); /* Slight dip on hover */
            box-shadow: 
              0 4px 0 var(--key-shadow), /* Reduced side height */
              0 0 25px var(--key-glow), /* Neon Glow */
              inset 0 2px 5px rgba(255,255,255,0.4);
            background: var(--key-color);
            color: white;
            border-color: transparent;
          }

          /* Active State (Pressed) */
          .key-btn:active {
            transform: translateY(8px); /* Full press down */
            box-shadow: 
              0 0 0 var(--key-shadow), /* No side visible */
              inset 0 5px 10px rgba(0,0,0,0.2); /* Inner shadow */
          }

          /* Colors Definition */
          .key-blue { --key-color: #3b82f6; --key-shadow: #1d4ed8; --key-glow: rgba(59, 130, 246, 0.6); }
          .key-cyan { --key-color: #06b6d4; --key-shadow: #0891b2; --key-glow: rgba(6, 182, 212, 0.6); }
          .key-red { --key-color: #ef4444; --key-shadow: #b91c1c; --key-glow: rgba(239, 68, 68, 0.6); }
          .key-pink { --key-color: #ec4899; --key-shadow: #be185d; --key-glow: rgba(236, 72, 153, 0.6); }
          .key-green { --key-color: #10b981; --key-shadow: #047857; --key-glow: rgba(16, 185, 129, 0.6); }
          .key-purple { --key-color: #8b5cf6; --key-shadow: #6d28d9; --key-glow: rgba(139, 92, 246, 0.6); }
          .key-orange { --key-color: #f97316; --key-shadow: #c2410c; --key-glow: rgba(249, 115, 22, 0.6); }
          .key-teal { --key-color: #14b8a6; --key-shadow: #0f766e; --key-glow: rgba(20, 184, 166, 0.6); }
          .key-yellow { --key-color: #eab308; --key-shadow: #a16207; --key-glow: rgba(234, 179, 8, 0.6); }
          .key-indigo { --key-color: #6366f1; --key-shadow: #4338ca; --key-glow: rgba(99, 102, 241, 0.6); }
        `}</style>
        
        {/* Main Groups */}
        <div className="w-full mb-8">
            <h2 className="text-xl font-bold mb-4 ml-4 border-l-4 border-indigo-500 pl-3 dark:text-white">Одежда и Обувь</h2>
            <div className="flex flex-wrap gap-5 justify-center">
                <Link to="/catalog?category=Women" className="key-btn key-pink">
                    <Shirt size={28} />
                    <span>Женщинам</span>
                </Link>
                <Link to="/catalog?category=Men" className="key-btn key-blue">
                    <Shirt size={28} />
                    <span>Мужчинам</span>
                </Link>
                <Link to="/catalog?category=Kids" className="key-btn key-green">
                    <Baby size={28} />
                    <span>Детям</span>
                </Link>
                <Link to="/catalog?category=Shoes" className="key-btn key-cyan">
                    <Footprints size={28} />
                    <span>Обувь</span>
                </Link>
                 <Link to="/catalog?category=Accessories" className="key-btn key-purple">
                    <Briefcase size={28} />
                    <span>Аксессуары</span>
                </Link>
            </div>
        </div>

        <div className="w-full mb-8">
            <h2 className="text-xl font-bold mb-4 ml-4 border-l-4 border-purple-500 pl-3 dark:text-white">Техника и Авто</h2>
            <div className="flex flex-wrap gap-5 justify-center">
                <Link to="/catalog?category=Electronics" className="key-btn key-indigo">
                    <Monitor size={28} />
                    <span>Электроника</span>
                </Link>
                <Link to="/catalog?category=Appliances" className="key-btn key-blue">
                    <Monitor size={28} />
                    <span>Бытовая</span>
                </Link>
                <Link to="/catalog?category=Auto" className="key-btn key-red">
                    <Car size={28} />
                    <span>Авто</span>
                </Link>
                 <Link to="/catalog?category=Repair" className="key-btn key-orange">
                    <Hammer size={28} />
                    <span>Ремонт</span>
                </Link>
                <Link to="/catalog?category=Transport" className="key-btn key-cyan">
                    <Car size={28} />
                    <span>Транспорт</span>
                </Link>
            </div>
        </div>

        <div className="w-full mb-8">
            <h2 className="text-xl font-bold mb-4 ml-4 border-l-4 border-green-500 pl-3 dark:text-white">Хобби, Дом и Спорт</h2>
            <div className="flex flex-wrap gap-5 justify-center">
                <Link to="/catalog?category=Home" className="key-btn key-teal">
                    <Sofa size={28} />
                    <span>Дом</span>
                </Link>
                <Link to="/catalog?category=Furniture" className="key-btn key-orange">
                    <Sofa size={28} />
                    <span>Мебель</span>
                </Link>
                <Link to="/catalog?category=Sports" className="key-btn key-green">
                    <Dumbbell size={28} />
                    <span>Спорт</span>
                </Link>
                <Link to="/catalog?category=Toys" className="key-btn key-yellow">
                    <Gamepad2 size={28} />
                    <span>Игрушки</span>
                </Link>
                 <Link to="/catalog?category=Books" className="key-btn key-blue">
                    <BookOpen size={28} />
                    <span>Книги</span>
                </Link>
                <Link to="/catalog?category=Stationery" className="key-btn key-indigo">
                    <PenTool size={28} />
                    <span>Канцелярия</span>
                </Link>
            </div>
        </div>

        <div className="w-full mb-8">
            <h2 className="text-xl font-bold mb-4 ml-4 border-l-4 border-pink-500 pl-3 dark:text-white">Красота и Здоровье</h2>
            <div className="flex flex-wrap gap-5 justify-center">
                <Link to="/catalog?category=Beauty" className="key-btn key-pink">
                    <Sparkles size={28} />
                    <span>Красота</span>
                </Link>
                <Link to="/catalog?category=Health" className="key-btn key-red">
                    <Heart size={28} />
                    <span>Здоровье</span>
                </Link>
                <Link to="/catalog?category=Flowers" className="key-btn key-green">
                    <Flower2 size={28} />
                    <span>Цветы</span>
                </Link>
                <Link to="/catalog?category=Food" className="key-btn key-orange">
                    <Coffee size={28} />
                    <span>Продукты</span>
                </Link>
            </div>
        </div>

        <div className="w-full mb-8">
            <h2 className="text-xl font-bold mb-4 ml-4 border-l-4 border-yellow-500 pl-3 dark:text-white">Разное</h2>
             <div className="flex flex-wrap gap-5 justify-center">
                <Link to="/catalog?category=Travel" className="key-btn key-cyan">
                    <Plane size={28} />
                    <span>Travel</span>
                </Link>
                <Link to="/catalog?category=Special" className="key-btn key-purple">
                    <Gift size={28} />
                    <span>Акции</span>
                </Link>
                 <Link to="/catalog?category=Adults" className="key-btn key-red">
                    <ShieldPlus size={28} />
                    <span>18+</span>
                </Link>
             </div>
        </div>
        
      </div>
    </div>
  );
};
