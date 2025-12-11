import React, { useState } from 'react';
import * as back4app from '../services/back4appRest';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';

export const AddProductFormNew: React.FC<{ vendorId: string; onSuccess?: () => void }> = ({ vendorId, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'books',
    price: '',
    description: '',
    stock: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setFile(f);
      try {
        const url = URL.createObjectURL(f);
        setPreviewUrl(url);
      } catch (err) {
        setPreviewUrl(null);
      }
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.title || !formData.category || !formData.price || !formData.stock) {
      setMessage({ type: 'error', text: 'Заполните все обязательные поля' });
      return;
    }

    setLoading(true);
    try {
      if (!back4app.isInitialized()) {
        throw new Error('Back4App не инициализирован');
      }

      let imagePayload: any = undefined;
      if (file) {
        // upload file to Back4App and get back { name, url }
        const uploaded = await back4app.uploadFile(file);
        imagePayload = uploaded; // { name, url }
      }

      await back4app.createProduct({
        title: formData.title,
        author: formData.author || undefined,
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description,
        vendorId,
        vendorName: vendorId,
        stock: parseInt(formData.stock),
        rating: 5,
        status: 'active',
        image: imagePayload,
      });

      setMessage({ type: 'success', text: 'Товар успешно добавлен!' });
      setFormData({ title: '', author: '', category: 'books', price: '', description: '', stock: '' });
      setFile(null);
      if (previewUrl) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {}
      }
      setPreviewUrl(null);
      // notify parent to refresh list / close modal
      try {
        onSuccess && onSuccess();
      } catch (err) {
        // ignore
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ошибка добавления товара';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Package size={24} /> Добавить товар
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Название *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Введите название товара"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Автор / Производитель
          </label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="Например: Donald Knuth"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Категория *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="books">Книги</option>
              <option value="stationery">Канцелярия</option>
              <option value="electronics">Электроника</option>
              <option value="other">Другое</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Цена ($) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="99.99"
              step="0.01"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Количество на складе *
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            placeholder="10"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Описание
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Подробное описание товара..."
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Фото товара</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {previewUrl && (
            <img src={previewUrl} alt="preview" className="mt-2 max-h-40 rounded" />
          )}
        </div>

        {message && (
          <div className={`p-3 rounded flex items-start gap-2 ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded transition"
        >
          {loading ? 'Добавление...' : 'Добавить товар'}
        </button>
      </form>
    </div>
  );
};

export default AddProductFormNew;
