/**
 * Финансовые отчеты и аналитика вендора
 * Просмотр доходов, комиссий и истории транзакций через Parse/Back4App
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader, TrendingUp, DollarSign, TrendingDown, Download, Filter } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as parseSDK from '../services/parseSDK';

interface Transaction {
  objectId: string;
  vendorId: string;
  orderId: string;
  amount: number;
  commission: number;
  netIncome: number;
  type: 'sale' | 'refund' | 'withdrawal';
  status: 'completed' | 'pending' | 'failed';
  createdAt?: Date;
}

interface FinancialReport {
  totalIncome: number;
  totalCommission: number;
  totalRefunds: number;
  netIncome: number;
  transactionCount: number;
}

interface VendorFinanceProps {
  vendorId: string;
}

const VendorFinance: React.FC<VendorFinanceProps> = ({ vendorId }) => {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  // Загрузка финансовых данных
  useEffect(() => {
    loadFinancialData();
  }, [vendorId]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Загружаем финансовый отчет
      const financialReport = await parseSDK.getFinancialReport(vendorId);
      setReport(financialReport);

      // Загружаем транзакции
      const items = await parseSDK.getTransactionsByVendor(vendorId);
      const transactionsData = items.map((item: any) => ({
        objectId: item.id,
        vendorId: item.get('vendorId'),
        orderId: item.get('orderId'),
        amount: item.get('amount'),
        commission: item.get('commission'),
        netIncome: item.get('netIncome'),
        type: item.get('type'),
        status: item.get('status'),
        createdAt: item.createdAt,
      }));

      setTransactions(transactionsData);
    } catch (err) {
      console.error('Ошибка загрузки финансовых данных:', err);
      setError('Не удалось загрузить финансовые данные. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  // Подготовка данных для графиков
  const getChartData = () => {
    const groupedByDate: Record<string, { sales: number; refunds: number }> = {};

    transactions.forEach(tx => {
      if (tx.createdAt) {
        const date = new Date(tx.createdAt).toLocaleDateString('ru-RU');
        if (!groupedByDate[date]) {
          groupedByDate[date] = { sales: 0, refunds: 0 };
        }
        if (tx.type === 'sale') {
          groupedByDate[date].sales += tx.amount;
        } else if (tx.type === 'refund') {
          groupedByDate[date].refunds += tx.amount;
        }
      }
    });

    return Object.entries(groupedByDate)
      .slice(-30) // Последние 30 дней
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        refunds: data.refunds,
      }));
  };

  // Данные для круговой диаграммы
  const getPieChartData = () => {
    if (!report) return [];
    return [
      { name: 'Чистый доход', value: Math.max(0, report.netIncome) },
      { name: 'Комиссии', value: report.totalCommission },
      { name: 'Возвраты', value: report.totalRefunds },
    ].filter(item => item.value > 0);
  };

  // Фильтрация по типам статусов
  const getTransactionStats = () => {
    const completed = transactions.filter(t => t.status === 'completed').length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    const failed = transactions.filter(t => t.status === 'failed').length;
    return { completed, pending, failed };
  };

  const transactionStats = getTransactionStats();
  const chartData = getChartData();
  const pieData = getPieChartData();
  const COLORS = ['#4f46e5', '#ef4444', '#f59e0b'];

  // Карточка статистики
  const StatCard: React.FC<{ label: string; value: string; subtext?: string; icon: React.ReactNode; color: string }> = ({
    label,
    value,
    subtext,
    icon,
    color,
  }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-lg p-6 border-l-4 ${color} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{value}</p>
          {subtext && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`${color.replace('border-', 'text-')} opacity-20`}>{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

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

      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Финансовые отчеты</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Аналитика доходов и расходов</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap">
          <Download size={18} />
          Загрузить отчет
        </button>
      </div>

      {/* Основная статистика */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Валовый доход"
            value={parseSDK.formatCurrency(report.totalIncome)}
            icon={<TrendingUp size={32} />}
            color="border-green-500"
          />
          <StatCard
            label="Всего комиссий"
            value={parseSDK.formatCurrency(report.totalCommission)}
            subtext={report.totalIncome > 0 ? `${((report.totalCommission / report.totalIncome) * 100).toFixed(1)}%` : '—'}
            icon={<DollarSign size={32} />}
            color="border-blue-500"
          />
          <StatCard
            label="Возвраты"
            value={parseSDK.formatCurrency(report.totalRefunds)}
            icon={<TrendingDown size={32} />}
            color="border-orange-500"
          />
          <StatCard
            label="Чистый доход"
            value={parseSDK.formatCurrency(report.netIncome)}
            icon={<TrendingUp size={32} />}
            color="border-purple-500"
          />
        </div>
      )}

      {/* Статус транзакций */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border dark:border-slate-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Статус транзакций</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{transactionStats.completed}</p>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">Завершено</p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-3xl font-bold text-orange-600">{transactionStats.pending}</p>
            <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">В процессе</p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-3xl font-bold text-red-600">{transactionStats.failed}</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">Ошибки</p>
          </div>
        </div>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График продаж и возвратов */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Динамика продаж</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#4f46e5" name="Продажи" strokeWidth={2} />
                <Line type="monotone" dataKey="refunds" stroke="#ef4444" name="Возвраты" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Нет данных для отображения</p>
          )}
        </div>

        {/* Круговая диаграмма доходов */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Распределение доходов</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${parseSDK.formatCurrency(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => parseSDK.formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Нет данных для отображения</p>
          )}
        </div>
      </div>

      {/* История транзакций */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border dark:border-slate-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">История транзакций</h3>

        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">Нет транзакций</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Дата</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Заказ</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Тип</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Сумма</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Комиссия</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Чистый доход</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Статус</th>
                </tr>
              </thead>
              <tbody>
                {transactions
                  .sort((a, b) => {
                    const timeA = new Date(a.createdAt || 0).getTime();
                    const timeB = new Date(b.createdAt || 0).getTime();
                    return timeB - timeA;
                  })
                  .slice(0, 10)
                  .map(tx => (
                    <tr key={tx.objectId} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {tx.createdAt ? parseSDK.formatDate(tx.createdAt) : '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{tx.orderId}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tx.type === 'sale'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : tx.type === 'refund'
                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        }`}>
                          {tx.type === 'sale' ? 'Продажа' : tx.type === 'refund' ? 'Возврат' : 'Вывод'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                        {parseSDK.formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                        {parseSDK.formatCurrency(tx.commission)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-600">
                        {parseSDK.formatCurrency(tx.netIncome)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tx.status === 'completed'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : tx.status === 'pending'
                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        }`}>
                          {tx.status === 'completed' ? 'Завершена' : tx.status === 'pending' ? 'В процессе' : 'Ошибка'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorFinance;
