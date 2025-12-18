
// Этот файл управляет настройками подключения
// В реальном проекте эти значения берутся из .env файла

export const config = {
  // Если true, используются данные из constants.ts. Если false - запросы к API.
  // В продакшне ВСЕГДА false.
  USE_MOCK: import.meta.env.MODE === 'development' && !import.meta.env.VITE_DISABLE_MOCK,

  // Адрес вашего бэкенда
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',

  // Ключи API
  GEMINI_API_KEY: import.meta.env.VITE_API_KEY || '',
};

