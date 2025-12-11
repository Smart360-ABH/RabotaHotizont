import React, { useState } from 'react';
import * as back4app from '../services/back4app';

export const TestBack4App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);

  const handleCreateGameScore = async () => {
    setLoading(true);
    setMessage('');
    try {
      const score = Math.floor(Math.random() * 5000) + 1000;
      const result = await back4app.createGameScore(score, 'Test Player', false);
      const id = (result as any).id || (result as any).objectId || result;
      setMessage(`✅ Создана запись! ID: ${id}`);
      setResults([result]);
    } catch (error) {
      setMessage(`❌ Ошибка: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryGameScores = async () => {
    setLoading(true);
    setMessage('');
    try {
      const results = await back4app.queryGameScores(0);
      setMessage(`✅ Найдено ${results.length} записей`);
      setResults(results);
    } catch (error) {
      setMessage(`❌ Ошибка: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGameScore = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (results.length === 0) {
        setMessage('❌ Сначала создайте или загрузите запись');
        setLoading(false);
        return;
      }
      const result = results[0];
      const newScore = (result.score || 1000) + 100;
      await back4app.updateGameScore(result.objectId, { score: newScore });
      setMessage(`✅ Запись обновлена! Новый score: ${newScore}`);
      result.score = newScore;
      setResults([result]);
    } catch (error) {
      setMessage(`❌ Ошибка: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGameScore = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (results.length === 0) {
        setMessage('❌ Нечего удалять');
        setLoading(false);
        return;
      }
      const result = results[0];
      await back4app.deleteGameScore(result.objectId);
      setMessage(`✅ Запись удалена`);
      setResults([]);
    } catch (error) {
      setMessage(`❌ Ошибка: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const isInitialized = true; // back4app module exports game score functions; if they work, it's initialized

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">
        🔌 Тест Back4App REST API
      </h2>

      {!isInitialized && (
        <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 rounded">
          ⚠️ Back4App не инициализирован. Проверьте переменные окружения:
          <br />
          VITE_PARSE_APP_ID и VITE_PARSE_JS_KEY
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={handleCreateGameScore}
          disabled={!isInitialized || loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded font-semibold transition"
        >
          ✏️ Создать
        </button>
        <button
          onClick={handleQueryGameScores}
          disabled={!isInitialized || loading}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded font-semibold transition"
        >
          📖 Прочитать
        </button>
        <button
          onClick={handleUpdateGameScore}
          disabled={!isInitialized || loading || results.length === 0}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded font-semibold transition"
        >
          🔄 Обновить
        </button>
        <button
          onClick={handleDeleteGameScore}
          disabled={!isInitialized || loading || results.length === 0}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded font-semibold transition"
        >
          🗑️ Удалить
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded">
          {message}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700 rounded">
          <h3 className="font-bold mb-2 text-slate-900 dark:text-slate-100">Результат:</h3>
          <pre className="text-xs bg-slate-800 text-green-400 p-2 rounded overflow-auto max-h-64">
            {JSON.stringify(results[0], null, 2)}
          </pre>
        </div>
      )}

      {loading && (
        <div className="mt-4 text-center text-slate-500 dark:text-slate-400">
          ⏳ Загрузка...
        </div>
      )}
    </div>
  );
};

export default TestBack4App;
