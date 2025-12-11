import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, X, Check, AlertCircle, Loader, FileSpreadsheet, FileText, Bug } from 'lucide-react';
import * as back4app from '../services/back4appRest';

interface CsvUploadProps {
  vendorId: string;
  onSuccess: (count: number, error?: string) => void;
  onClose: () => void;
}

interface ParsedProduct {
  sku?: string;
  title: string;
  category: string;
  price: number;
  image1?: string;
  image2?: string;
  description?: string;
  errors?: string[];
}

export const CsvUpload: React.FC<CsvUploadProps> = ({ vendorId, onSuccess, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedProduct[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setLogs([]);
      setError(null);

      const ext = selected.name.split('.').pop()?.toLowerCase();

      if (ext === 'csv') {
        parseCsv(selected);
      } else if (ext === 'xlsx' || ext === 'xls') {
        parseExcel(selected);
      } else {
        setError('Неподдерживаемый формат. Используйте CSV или Excel (.xlsx)');
      }
    }
  };

  const normalizeHeader = (h: string) => h.trim().toLowerCase();

  const mapRow = (row: any, index: number): ParsedProduct | null => {
    // Try to find keys regardless of case or slight variations
    const keys = Object.keys(row);
    const findKey = (candidates: string[]) => keys.find(k => candidates.includes(k.trim().toLowerCase()));

    const titleKey = findKey(['название товара', 'название', 'title', 'name', 'product']);
    const categoryKey = findKey(['категория', 'category', 'cat']);
    const priceKey = findKey(['цена', 'price', 'cost', 'цена, rub', 'rub']);
    const descKey = findKey(['описание', 'description', 'desc']);
    const image1Key = findKey(['url изображения 1', 'image1', 'image 1', 'img1', 'url 1', 'фото 1', 'photo 1']);
    const image2Key = findKey(['url изображения 2', 'image2', 'image 2', 'img2', 'url 2']);
    const skuKey = findKey(['sku', 'атикул', 'код']);

    const title = titleKey ? row[titleKey] : '';
    const category = categoryKey ? row[categoryKey] : 'Разное';

    // Price cleaning
    let priceRaw = priceKey ? row[priceKey] : '0';
    if (typeof priceRaw === 'string') {
      priceRaw = priceRaw.replace(',', '.').replace(/[^0-9.]/g, '');
    }
    const price = parseFloat(priceRaw) || 0;

    const issues: string[] = [];
    if (!title) issues.push('Нет названия');
    if (!price || price <= 0) issues.push(`Цена 0 или некорректная (${priceRaw})`);

    // Log mapping for first row to help debug
    if (index === 0) {
      addLog(`First Row Mapping Check:`);
      addLog(`Title found at: ${titleKey} -> ${title}`);
      addLog(`Price found at: ${priceKey} -> ${price}`);
      addLog(`Available columns: ${keys.join(', ')}`);
    }

    if (issues.length > 0) {
      // If it's functionally empty row, ignore it
      if (!title && !price) return null;
      return {
        title: title || 'Error',
        category,
        price,
        errors: issues
      };
    }

    return {
      sku: skuKey ? row[skuKey] : '',
      title,
      category,
      price,
      image1: image1Key ? row[image1Key] : '',
      image2: image2Key ? row[image2Key] : '',
      description: descKey ? row[descKey] : '',
    };
  };

  const parseCsv = (file: File) => {
    addLog('Parsing CSV...');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          addLog(`CSV Warnings: ${results.errors.map(e => e.message).join('; ')}`);
        }

        const mapped = results.data
          .map((row, i) => mapRow(row, i))
          .filter((p): p is ParsedProduct => p !== null);

        setPreview(mapped);
        addLog(`Parsed ${mapped.length} rows.`);
        if (mapped.length === 0) {
          setError('Не удалось найти товары. Проверьте заголовки столбцов (Название товара, Цена, RUB). См. лог ниже.');
        }
      },
      error: (err) => {
        setError('Ошибка чтения CSV: ' + err.message);
      }
    });
  };

  const parseExcel = async (file: File) => {
    addLog('Reading Excel file...');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        addLog(`Excel sheet "${firstSheetName}" converted to JSON (${json.length} rows)`);

        const mapped = json
          .map((row, i) => mapRow(row, i))
          .filter((p): p is ParsedProduct => p !== null);

        setPreview(mapped);
        addLog(`Parsed ${mapped.length} valid products.`);
        if (mapped.length === 0) {
          setError('Не удалось распознать товары. Проверьте названия столбцов. См. лог отладки.');
        }
      } catch (err: any) {
        console.error(err);
        setError('Ошибка парсинга Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    const valid = preview.filter(p => !p.errors);
    if (valid.length === 0) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    let successCount = 0;
    let firstError = '';

    try {
      // 1. Fetch existing products to check for duplicates
      let existingTitles = new Set<string>();
      addLog('Checking for existing products...');
      try {
        const existing = await back4app.getProductsByVendor(vendorId);
        existing.forEach((p: any) => existingTitles.add(p.title.toLowerCase().trim()));
        addLog(`Loaded ${existing.length} existing products for duplicate check.`);
      } catch (e: any) {
        console.warn('Failed to load existing products for duplicate check', e);
        addLog(`Warning: Failed to load existing products for duplicate check: ${e.message}`);
      }

      // 2. Filter Duplicates from the current batch
      const productsToUpload: ParsedProduct[] = [];
      let duplicatesCount = 0;

      valid.forEach((p: ParsedProduct) => {
        const normalizedTitle = String(p.title).toLowerCase().trim();
        if (existingTitles.has(normalizedTitle)) {
          duplicatesCount++;
          addLog(`Skipping duplicate: ${p.title}`);
        } else {
          productsToUpload.push(p);
          // Prevent duplicates within the same file itself
          existingTitles.add(normalizedTitle);
        }
      });

      if (duplicatesCount > 0) {
        addLog(`Found ${duplicatesCount} duplicate products. They will be skipped.`);
        setError(`Найдено ${duplicatesCount} дубликатов. Они будут пропущены.`);
      }

      if (productsToUpload.length === 0) {
        addLog('No new products to upload (all duplicates or empty).');
        setError('Нет новых товаров для загрузки (все дубликаты или пустые).');
        setUploading(false);
        return;
      }

      addLog(`Attempting to upload ${productsToUpload.length} unique products.`);

      // Upload unique products
      for (let i = 0; i < productsToUpload.length; i++) {
        const item = productsToUpload[i];
        try {
          await back4app.createProduct({
            title: item.title,
            description: item.description,
            price: item.price,
            category: item.category,
            vendorId: vendorId,
            imageUrl: item.image1, // Save URL to string field
            // image: item.image1, // Don't save string to File field
            images: [item.image1, item.image2].filter(Boolean) as string[],
            sku: item.sku,
            status: 'active'
          });
          successCount++;
        } catch (err: any) {
          const msg = err.message || JSON.stringify(err);
          console.error(`Failed to upload ${item.title}:`, msg);
          addLog(`Upload error ${item.title}: ${msg}`);
          if (!firstError) firstError = msg;
        }
        setProgress(Math.round(((i + 1) / valid.length) * 100));
      }
      onSuccess(successCount, successCount < valid.length ? `First error: ${firstError}` : undefined);
    } catch (err: any) {
      setError('Критическая ошибка загрузки: ' + err.message);
      setUploading(false);
    }
  };

  const validCount = preview.filter(p => !p.errors).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-4xl p-6 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Upload className="text-indigo-600" />
            Импорт товаров (CSV / Excel)
          </h3>
          {!uploading && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X />
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Debug Logs Area */}
        {logs.length > 0 && (
          <div className="mb-4 p-2 bg-slate-100 dark:bg-slate-900 rounded text-xs font-mono max-h-32 overflow-auto border border-slate-300">
            <div className="font-bold text-slate-500 mb-1 flex items-center gap-1"><Bug size={12} /> Лог отладки:</div>
            {logs.map((L, i) => <div key={i}>{L}</div>)}
          </div>
        )}

        {!uploading && preview.length === 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center">
              <div className="flex gap-4 mb-4">
                <FileSpreadsheet className="w-12 h-12 text-green-600" />
                <FileText className="w-12 h-12 text-blue-500" />
              </div>
              <div className="font-medium text-lg">Нажмите для выбора файла</div>
              <div className="text-sm text-gray-500 mt-2">Поддерживается: Excel (.xlsx), CSV (.csv)</div>
            </label>
          </div>
        )}

        {preview.length > 0 && !uploading && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Распознано: <strong>{preview.length}</strong> (Валидных: {validCount})
              </div>
              <button
                onClick={() => { setPreview([]); setLogs([]); setFile(null); }}
                className="text-sm text-red-500 hover:underline"
              >
                Сбросить
              </button>
            </div>

            <div className="flex-1 overflow-auto border rounded mb-4">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 dark:bg-slate-700 sticky top-0">
                  <tr>
                    <th className="p-2">Название</th>
                    <th className="p-2">Категория</th>
                    <th className="p-2">Цена</th>
                    <th className="p-2">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((p, idx) => (
                    <tr key={idx} className={`border-b last:border-0 ${p.errors ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                      <td className="p-2">{p.title}</td>
                      <td className="p-2">{p.category}</td>
                      <td className="p-2">{p.price} ₽</td>
                      <td className="p-2">
                        {p.errors ? (
                          <div className="text-red-500 flex items-center gap-1" title={p.errors.join(', ')}>
                            <AlertCircle size={14} /> Ошибка
                          </div>
                        ) : (
                          <div className="text-green-600"><Check size={16} /></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={onClose} className="px-4 py-2 border rounded">
                Отмена
              </button>
              <button
                onClick={handleUpload}
                disabled={validCount === 0}
                className={`px-6 py-2 text-white rounded font-medium ${validCount === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                Загрузить {validCount} товаров
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="py-12 text-center">
            <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <div className="text-lg font-medium mb-2">Загрузка товаров...</div>
            <div className="text-sm text-gray-500 mb-4">Пожалуйста, не закрывайте окно</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-md mx-auto mb-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">{progress}% завершено</div>
          </div>
        )}
      </div>
    </div>
  );
};
