
// Этот файл управляет настройками подключения
// В реальном проекте эти значения берутся из .env файла

export const config = {
  // Если true, используются данные из constants.ts. Если false - запросы к API.
  // Для переключения на реальный бэкенд, установите в false
  USE_MOCK: process.env.NODE_ENV === 'development' || true, 
  
  // Адрес вашего будущего бэкенда (например, на локалхосте или Vercel/Render)
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  
  // Ключи API
  GEMINI_API_KEY: process.env.REACT_APP_GEMINI_KEY || '',
};
