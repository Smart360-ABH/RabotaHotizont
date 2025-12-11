# Деплой на Render

## Структура проекта

Проект состоит из двух частей:
1. **Frontend** (React + Vite) - статический сайт
2. **Backend** (Express + TypeScript) - API сервер

## Настройка на Render

### 1. Frontend (Static Site)

**Тип сервиса:** Static Site

**Настройки:**
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Auto-Deploy:** Yes

**Переменные окружения:**
```
VITE_PARSE_APP_ID=<your_app_id>
VITE_PARSE_JS_KEY=<your_js_key>
VITE_API_KEY=<your_google_api_key>
```

### 2. Backend (Web Service)

**Тип сервиса:** Web Service

**Настройки:**
- **Root Directory:** `server`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`
- **Auto-Deploy:** Yes

**Переменные окружения:**
```
PARSE_APP_ID=<your_app_id>
PARSE_REST_KEY=<your_rest_key>
PARSE_MASTER_KEY=<your_master_key>
ADMIN_SECRET=<your_admin_secret>
PORT=4000
```

## Важные замечания

### Безопасность
⚠️ **НИКОГДА** не коммитьте файлы `.env` в Git!

### CORS
Backend должен разрешать запросы с домена фронтенда. В `server/src/index.ts` настроен CORS для всех доменов (для разработки). В продакшене укажите конкретный домен:

```typescript
app.use(cors({
  origin: 'https://your-frontend.onrender.com'
}));
```

### API URL
После деплоя бэкенда, обновите URL в фронтенде:
- Создайте переменную `VITE_API_URL` в настройках Render
- Используйте её в `config.ts`

## Проверка перед деплоем

✅ Все зависимости установлены
✅ Скрипт `build` работает локально
✅ Скрипт `start` работает локально (для бэкенда)
✅ Переменные окружения настроены
✅ `.gitignore` содержит `.env` файлы
✅ CORS настроен правильно

## Устранение проблем

### Ошибка "npm ERR! missing script: start"
- **Решение:** Убедитесь, что в `package.json` есть скрипт `start`
- Для фронтенда: используйте Static Site, а не Web Service

### Ошибка 404 при переходе по страницам
- **Решение:** Добавьте файл `_redirects` в `public/`:
  ```
  /*    /index.html   200
  ```

### Backend не подключается к Parse
- **Решение:** Проверьте переменные окружения в настройках Render
