
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Filter, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { ProductCard } from '../components/ProductCard';
import { SortOption, Category } from '../types';

// --- Deep Hierarchy Definitions ---
interface CategoryNode {
  id: string;
  label: string;
  children?: CategoryNode[];
}

const CATEGORY_HIERARCHY: Record<string, CategoryNode[]> = {
  'Women': [
    { id: 'w_clothes', label: 'Одежда', children: [
        { id: 'w_blouses', label: 'Блузки и рубашки' },
        { id: 'w_pants', label: 'Брюки' },
        { id: 'w_outerwear', label: 'Верхняя одежда' },
        { id: 'w_jumpers', label: 'Джемперы и кардиганы' },
        { id: 'w_jeans', label: 'Джинсы' },
        { id: 'w_suits', label: 'Костюмы' },
        { id: 'w_dresses', label: 'Платья' },
        { id: 'w_skirts', label: 'Юбки' }
    ]},
    { id: 'w_underwear', label: 'Нижнее бельё', children: [
        { id: 'w_bras', label: 'Бюстгальтеры' },
        { id: 'w_panties', label: 'Трусики' },
        { id: 'w_pajamas', label: 'Пижамы' }
    ]},
    { id: 'w_maternity', label: 'Для беременных' },
    { id: 'w_plus_size', label: 'Большие размеры' }
  ],
  'Men': [
      { id: 'm_clothes', label: 'Одежда', children: [
          { id: 'm_shirts', label: 'Рубашки и футболки' },
          { id: 'm_pants', label: 'Брюки и джинсы' },
          { id: 'm_outerwear', label: 'Верхняя одежда' },
          { id: 'm_suits', label: 'Костюмы' },
          { id: 'm_hoodies', label: 'Худи и свитшоты' }
      ]},
      { id: 'm_underwear', label: 'Нижнее бельё' },
      { id: 'm_home_clothes', label: 'Домашняя одежда' }
  ],
  'Kids': [
      { id: 'newborn', label: 'Для новорождённых (0-3)', children: [
          { id: 'nb_clothes', label: 'Одежда и комплекты' },
          { id: 'nb_shoes', label: 'Пинетки' }
      ]},
      { id: 'boys', label: 'Для мальчиков', children: [
          { id: 'b_clothes', label: 'Одежда' },
          { id: 'b_school', label: 'Школа' }
      ]},
      { id: 'girls', label: 'Для девочек', children: [
          { id: 'g_clothes', label: 'Одежда' },
          { id: 'g_school', label: 'Школа' }
      ]}
  ],
  'Shoes': [
      { id: 'w_shoes', label: 'Женская обувь', children: [
          { id: 'w_sneakers', label: 'Кроссовки' },
          { id: 'w_boots', label: 'Сапоги' },
          { id: 'w_heels', label: 'Туфли' }
      ]},
      { id: 'm_shoes', label: 'Мужская обувь', children: [
          { id: 'm_sneakers', label: 'Кроссовки' },
          { id: 'm_boots', label: 'Ботинки' }
      ]},
      { id: 'k_shoes', label: 'Детская обувь' }
  ],
  'Electronics': [
    { id: 'phones', label: 'Смартфоны и часы', children: [
        { id: 'smartphones', label: 'Смартфоны' },
        { id: 'smartwatches', label: 'Умные часы' }
    ]},
    { id: 'audio', label: 'Аудиотехника', children: [
        { id: 'headphones', label: 'Наушники' },
        { id: 'speakers', label: 'Колонки' }
    ]},
    { id: 'computers', label: 'Компьютеры', children: [
        { id: 'laptops', label: 'Ноутбуки' },
        { id: 'pc_parts', label: 'Комплектующие' }
    ]},
    { id: 'tv_gaming', label: 'ТВ и Игры', children: [
        { id: 'consoles', label: 'Консоли' },
        { id: 'games', label: 'Игры' }
    ]}
  ],
  'Home': [
      { id: 'textiles', label: 'Текстиль', children: [
          { id: 'bedding', label: 'Постельное белье' },
          { id: 'curtains', label: 'Шторы' }
      ]},
      { id: 'kitchen_supplies', label: 'Кухня', children: [
          { id: 'dishes', label: 'Посуда' },
          { id: 'cooking', label: 'Готовка' }
      ]},
      { id: 'decor', label: 'Декор и интерьер' },
      { id: 'cleaning', label: 'Уборка и хранение' }
  ],
  'Beauty': [
      { id: 'makeup', label: 'Косметика', children: [
          { id: 'face', label: 'Лицо' },
          { id: 'eyes', label: 'Глаза' },
          { id: 'lips', label: 'Губы' }
      ]},
      { id: 'perfume', label: 'Парфюмерия' },
      { id: 'hair', label: 'Уход за волосами' },
      { id: 'body', label: 'Уход за телом' }
  ],
  'Appliances': [
      { id: 'large_appliances', label: 'Крупная техника', children: [
          { id: 'fridges', label: 'Холодильники' },
          { id: 'washing_machines', label: 'Стиральные машины' }
      ]},
      { id: 'kitchen_appliances', label: 'Техника для кухни', children: [
          { id: 'microwaves', label: 'Микроволновки' },
          { id: 'blenders', label: 'Блендеры' }
      ]},
      { id: 'home_appliances', label: 'Техника для дома', children: [
          { id: 'vacuums', label: 'Пылесосы' },
          { id: 'irons', label: 'Утюги' }
      ]}
  ],
  'Toys': [
      { id: 'constructors', label: 'Конструкторы' },
      { id: 'dolls', label: 'Куклы' },
      { id: 'rc_toys', label: 'Радиоуправляемые' },
      { id: 'board_games', label: 'Настольные игры' }
  ],
  'Sports': [
      { id: 'fitness', label: 'Фитнес и тренажеры' },
      { id: 'sportswear', label: 'Спортивная одежда' },
      { id: 'tourism', label: 'Туризм и отдых' },
      { id: 'cycling', label: 'Велоспорт' }
  ],
  'Auto': [
      { id: 'car_electronics', label: 'Автоэлектроника' },
      { id: 'car_accessories', label: 'Аксессуары' },
      { id: 'car_care', label: 'Автохимия' },
      { id: 'tires', label: 'Шины и диски' }
  ],
  'Books': [
      { id: 'fiction', label: 'Художественная' },
      { id: 'non_fiction', label: 'Нон-фикшн' },
      { id: 'kids_books', label: 'Детская' },
      { id: 'education', label: 'Учебная' }
  ],
  'Stationery': [
      { id: 'school', label: 'Школа' },
      { id: 'office', label: 'Офис' },
      { id: 'art_supplies', label: 'Творчество' }
  ],
  'Food': [
      { id: 'grocery', label: 'Бакалея' },
      { id: 'drinks', label: 'Напитки' },
      { id: 'snacks', label: 'Снеки и сладости' },
      { id: 'healthy', label: 'Здоровое питание' }
  ],
  'Furniture': [
      { id: 'living_room_furn', label: 'Гостиная' },
      { id: 'bedroom_furn', label: 'Спальня' },
      { id: 'kitchen_furn', label: 'Кухня' }
  ],
  'Garden': [
      { id: 'garden_tools', label: 'Инструменты' },
      { id: 'seeds', label: 'Семена и удобрения' },
      { id: 'garden_decor', label: 'Садовый декор' }
  ],
  'Repair': [
      { id: 'tools', label: 'Инструменты' },
      { id: 'materials', label: 'Стройматериалы' },
      { id: 'electrical', label: 'Электрика' }
  ],
  'Pets': [
      { id: 'cats', label: 'Кошки' },
      { id: 'dogs', label: 'Собаки' },
      { id: 'small_pets', label: 'Грызуны и птицы' }
  ],
  'Health': [
      { id: 'supplements', label: 'БАДы и витамины' },
      { id: 'orthopedics', label: 'Ортопедия' },
      { id: 'medical_devices', label: 'Приборы' }
  ],
  'Flowers': [
      { id: 'bouquets', label: 'Букеты' },
      { id: 'potted', label: 'Горшечные' }
  ],
  'Accessories': [
      { id: 'bags', label: 'Сумки' },
      { id: 'jewelry', label: 'Украшения' },
      { id: 'watches', label: 'Часы' }
  ],
  'Adults': [
      { id: 'toys_18', label: 'Игрушки' },
      { id: 'lingerie_18', label: 'Белье' }
  ],
  'Transport': [
      { id: 'scooters', label: 'Электросамокаты' },
      { id: 'motorcycles', label: 'Мототехника' }
  ]
};

const CATEGORIES_LIST: Category[] = [
    'Women', 'Men', 'Kids', 'Shoes', 'Electronics', 'Appliances', 
    'Home', 'Furniture', 'Beauty', 'Health', 'Sports', 'Toys', 
    'Auto', 'Repair', 'Garden', 'Food', 'Pets', 'Books', 
    'Stationery', 'Accessories', 'Flowers', 'Transport', 'Adults'
];

const CATEGORY_LABELS: Record<string, string> = {
    'Women': 'Женщинам',
    'Men': 'Мужчинам',
    'Kids': 'Детям',
    'Shoes': 'Обувь',
    'Electronics': 'Электроника',
    'Appliances': 'Бытовая техника',
    'Home': 'Дом',
    'Furniture': 'Мебель',
    'Beauty': 'Красота',
    'Health': 'Здоровье',
    'Sports': 'Спорт',
    'Toys': 'Игрушки',
    'Auto': 'Автотовары',
    'Repair': 'Ремонт',
    'Garden': 'Дача и сад',
    'Food': 'Продукты',
    'Pets': 'Зоотовары',
    'Books': 'Книги',
    'Stationery': 'Канцтовары',
    'Accessories': 'Аксессуары',
    'Flowers': 'Цветы',
    'Transport': 'Транспорт',
    'Adults': '18+'
};

export const Catalog: React.FC = () => {
  const { products, searchQuery, setSearchQuery } = useMarket();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const initialCategory = queryParams.get('category') || 'All';

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 150000]);
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.POPULAR);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // State for expanded accordion items
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const cat = queryParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
      setSelectedTags([]);
      setExpandedNodes({}); 
    }
  }, [location.search]);

  // Deep ID collection
  const getBranchIds = (node: CategoryNode): string[] => {
      let ids = [node.id];
      if (node.children) {
          node.children.forEach(child => {
              ids = [...ids, ...getBranchIds(child)];
          });
      }
      return ids;
  };

  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by Search
    if (searchQuery) {
        result = result.filter(p => 
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.author?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    // Filter Status: Active only (or legacy mock without status)
    // We allow 'moderation' to be visible for demo purposes if desired, or strictly active.
    // Given the prompt "products appear immediately", we treat active as default visibility.
    result = result.filter(p => 
      !p.status || (p.status !== 'blocked' && p.status !== 'rejected' && p.status !== 'draft')
    );

    // Filter by Category
    if (selectedCategory !== 'All') {
        result = result.filter(p => p.category === selectedCategory);
    }

    // Filter by Tags
    if (selectedTags.length > 0) {
        result = result.filter(p => p.tags.some(tag => selectedTags.includes(tag)));
    }

    // Filter by Price
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort
    return result.sort((a, b) => {
        switch (sortBy) {
            case SortOption.PRICE_ASC: return a.price - b.price;
            case SortOption.PRICE_DESC: return b.price - a.price;
            case SortOption.NEWEST: return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
            case SortOption.POPULAR: default: return b.reviewsCount - a.reviewsCount;
        }
    });
  }, [products, searchQuery, selectedCategory, selectedTags, priceRange, sortBy]);

  const handleCategoryChange = (cat: string) => {
      setSelectedCategory(cat);
      setSelectedTags([]);
  };

  const toggleNode = (nodeId: string) => {
      setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleCheckboxChange = (node: CategoryNode) => {
      const isSelected = selectedTags.includes(node.id);
      let newTags = [...selectedTags];
      
      if (isSelected) {
          newTags = newTags.filter(t => t !== node.id);
      } else {
          newTags.push(node.id);
      }
      setSelectedTags(newTags);
  };

  const renderCategoryLevel = (nodes: CategoryNode[], depth = 0) => {
      return (
          <div className={`space-y-1 ${depth > 0 ? 'ml-4 border-l border-gray-200 dark:border-slate-700 pl-3 mt-1' : ''}`}>
              {nodes.map(node => {
                  const hasChildren = node.children && node.children.length > 0;
                  const isExpanded = expandedNodes[node.id];
                  const isChecked = selectedTags.includes(node.id);

                  return (
                      <div key={node.id}>
                          <div className="flex items-center gap-2 py-1">
                              {hasChildren ? (
                                  <button 
                                    onClick={() => toggleNode(node.id)} 
                                    className="text-gray-400 hover:text-indigo-500 transition"
                                  >
                                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                              ) : (
                                  <span className="w-[14px]"></span>
                              )}

                              <label className="flex items-center gap-2 cursor-pointer flex-1 group">
                                  <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleCheckboxChange(node)}
                                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-gray-300 dark:border-slate-600 dark:bg-slate-700"
                                  />
                                  <span className={`text-sm transition-colors ${isChecked ? 'text-indigo-600 font-medium' : 'text-slate-600 dark:text-slate-400 group-hover:text-indigo-500'}`}>
                                      {node.label}
                                  </span>
                              </label>
                          </div>
                          
                          {hasChildren && isExpanded && (
                              <div className="animate-fade-in-down">
                                  {renderCategoryLevel(node.children!, depth + 1)}
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Каталог товаров</h1>
          {searchQuery && (
              <div className="bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full text-indigo-700 dark:text-indigo-300 text-sm flex items-center gap-2">
                  Поиск: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}><X size={14}/></button>
              </div>
          )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className={`lg:w-72 flex-shrink-0 ${mobileFiltersOpen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-800 p-6 overflow-y-auto' : 'hidden lg:block'}`}>
            <div className="flex justify-between items-center lg:hidden mb-6">
                <h2 className="text-xl font-bold dark:text-white">Фильтры</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="dark:text-white"><X className="w-6 h-6"/></button>
            </div>

            <div className="space-y-8 pr-2">
                <div>
                    <h3 className="font-semibold mb-4 dark:text-gray-200 uppercase text-xs tracking-wider text-gray-500">Разделы</h3>
                    <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                         <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors">
                            <input 
                                type="radio" 
                                name="category" 
                                checked={selectedCategory === 'All'}
                                onChange={() => handleCategoryChange('All')}
                                className="text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className={`${selectedCategory === 'All' ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                Все товары
                            </span>
                        </label>
                        {CATEGORIES_LIST.map(cat => (
                            <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors">
                                <input 
                                    type="radio" 
                                    name="category" 
                                    checked={selectedCategory === cat}
                                    onChange={() => handleCategoryChange(cat)}
                                    className="text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <span className={`${selectedCategory === cat ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                    {CATEGORY_LABELS[cat] || cat}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {selectedCategory !== 'All' && CATEGORY_HIERARCHY[selectedCategory] && (
                    <div>
                        <h3 className="font-semibold mb-2 dark:text-gray-200 uppercase text-xs tracking-wider text-gray-500">
                            Категории: {CATEGORY_LABELS[selectedCategory]}
                        </h3>
                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 border dark:border-slate-700">
                            {renderCategoryLevel(CATEGORY_HIERARCHY[selectedCategory])}
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="font-semibold mb-4 dark:text-gray-200 uppercase text-xs tracking-wider text-gray-500">Цена</h3>
                    <div className="flex items-center gap-2 mb-4">
                        <input 
                            type="number" 
                            value={priceRange[0]} 
                            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                            className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none"
                            placeholder="От"
                        />
                        <span className="dark:text-white">-</span>
                        <input 
                            type="number" 
                            value={priceRange[1]} 
                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                            className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none"
                            placeholder="До"
                        />
                    </div>
                    <input 
                        type="range" 
                        min="0" max="150000" step="1000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                    />
                </div>
            </div>
            
             <button 
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full mt-8 py-3 bg-indigo-600 text-white font-bold rounded-xl lg:hidden shadow-lg"
             >
                 Показать {filteredProducts.length} товаров
             </button>
        </aside>

        <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border dark:border-slate-700">
                <button 
                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg dark:text-white font-medium"
                    onClick={() => setMobileFiltersOpen(true)}
                >
                    <Filter className="w-4 h-4" /> Фильтры
                </button>
                
                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Сортировка:</span>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-white focus:ring-0 cursor-pointer"
                    >
                        <option value={SortOption.POPULAR}>По популярности</option>
                        <option value={SortOption.NEWEST}>Сначала новинки</option>
                        <option value={SortOption.PRICE_ASC}>Сначала дешевые</option>
                        <option value={SortOption.PRICE_DESC}>Сначала дорогие</option>
                    </select>
                </div>
            </div>

            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 text-center">
                    <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4 text-4xl">
                        🔍
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Товары не найдены</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">
                        Попробуйте изменить категорию или очистить фильтры
                    </p>
                    <button 
                        onClick={() => {setSelectedCategory('All'); setSelectedTags([]); setSearchQuery('')}}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Сбросить всё
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
