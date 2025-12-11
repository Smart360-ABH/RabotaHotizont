/**
 * Управление товарами вендора (CRUD операции)
 * Полная поддержка создания, редактирования, удаления товаров с загрузкой изображений
 */

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Upload, X, Loader, AlertCircle, Search, ShoppingBag } from 'lucide-react';
import * as parseSDK from '../services/parseSDK';

interface Product {
  objectId: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  createdAt?: Date;
}

interface VendorProductsProps {
  vendorId: string;
}

const VendorProducts: React.FC<VendorProductsProps> = ({ vendorId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Форма товара
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    stock: 0,
    category: 'electronics',
    image: '',
  });

  // Загрузка товаров при первом рендере
  useEffect(() => {
    loadProducts();
  }, [vendorId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await parseSDK.getProductsByVendor(vendorId);
      
      const productsData = items.map((item: any) => ({
        objectId: item.id,
        title: item.get('title'),
        description: item.get('description'),
        price: item.get('price'),
        stock: item.get('stock'),
        category: item.get('category'),
        image: item.get('image'),
        createdAt: item.createdAt,
      }));
      
      setProducts(productsData);
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err);
      setError('Не удалось загрузить товары. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  // Обработка загрузки изображения
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const url = await parseSDK.uploadProductImage(file);
      setUploadedImageUrl(url);
      setFormData(prev => ({ ...prev, image: url }));
    } catch (err) {
      console.error('Ошибка загрузки изображения:', err);
      alert('Ошибка загрузки изображения');
    } finally {
      setImageUploading(false);
    }
  };

  // Сохранение товара (создание или обновление)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || formData.price <= 0 || formData.stock < 0) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      if (editingId) {
        // Обновление
        await parseSDK.updateProduct(editingId, {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          stock: formData.stock,
          category: formData.category,
          image: formData.image,
        });

        setProducts(prev =>
          prev.map(p =>
            p.objectId === editingId
              ? { ...p, ...formData }
              : p
          )
        );
      } else {
        // Создание
        const newProduct = await parseSDK.createProduct(vendorId, {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          stock: formData.stock,
          category: formData.category,
          image: formData.image,
          vendorId: vendorId,
        });

        setProducts(prev => [
          ...prev,
          {
            objectId: newProduct.id,
            ...formData,
          },
        ]);
      }

      // Очистка формы
      setFormData({
        title: '',
        description: '',
        price: 0,
        stock: 0,
        category: 'electronics',
        image: '',
      });
      setUploadedImageUrl(null);
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error('Ошибка сохранения товара:', err);
      alert('Ошибка сохранения товара');
    }
  };

  // Редактирование товара
  const handleEditProduct = (product: Product) => {
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      image: product.image || '',
    });
    setUploadedImageUrl(product.image || null);
    setEditingId(product.objectId);
    setShowForm(true);
  };

  // Удаление товара
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;

    try {
      await parseSDK.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.objectId !== id));
    } catch (err) {
      console.error('Ошибка удаления товара:', err);
      alert('Ошибка удаления товара');
    }
  };

  // Закрытие формы
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      price: 0,
      stock: 0,
      category: 'electronics',
      image: '',
    });
    setUploadedImageUrl(null);
  };

  // Фильтрация товаров по поисковому запросу
  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Ошибка */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">Ошибка</h3>
            <p className="text-red-800 dark:text-red-200 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Заголовок и кнопка добавления */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Мои товары</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Всего товаров: {filteredProducts.length}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          <Plus size={20} />
          Добавить товар
        </button>
      </div>

      {/* Поиск товаров */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
        <input
          type="text"
          placeholder="Поиск по названию или категории..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Модаль добавления/редактирования товара */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Редактировать товар' : 'Добавить новый товар'}
              </h3>
              <button onClick={handleCloseForm} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              {/* Название */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название товара
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Введите название товара"
                />
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Описание
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Введите описание товара"
                  rows={4}
                />
              </div>

              {/* Цена и Количество */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Цена (₽)
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Количество
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Категория */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Категория
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="electronics">Электроника</option>
                  <option value="clothing">Одежда</option>
                  <option value="books">Книги</option>
                  <option value="home">Товары для дома</option>
                  <option value="sports">Спорт</option>
                  <option value="other">Другое</option>
                </select>
              </div>

              {/* Загрузка изображения */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Изображение товара
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-4">
                  {uploadedImageUrl ? (
                    <div className="relative">
                      <img
                        src={uploadedImageUrl}
                        alt="Превью"
                        className="w-full h-48 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImageUrl(null);
                          setFormData(prev => ({ ...prev, image: '' }));
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex items-center justify-center gap-2 py-8">
                      {imageUploading ? (
                        <>
                          <Loader className="animate-spin" size={20} />
                          <span>Загрузка...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={20} className="text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Нажмите для загрузки изображения</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Кнопки действия */}
              <div className="flex gap-3 pt-4 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  {editingId ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Список товаров */}
      <div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center">
            <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Товары не найдены</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Нет товаров, соответствующих поиску' : 'Начните с добавления первого товара'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div key={product.objectId} className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Изображение */}
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">{product.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{product.description}</p>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Цена</p>
                      <p className="font-bold text-indigo-600">{parseSDK.formatCurrency(product.price)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">На складе</p>
                      <p className="font-bold text-gray-900 dark:text-white">{product.stock}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      <Edit2 size={16} />
                      Изменить
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.objectId)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <Trash2 size={16} />
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorProducts;
