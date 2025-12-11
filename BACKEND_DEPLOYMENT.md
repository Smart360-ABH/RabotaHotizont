# Развёртывание защищённого backend-а для Gorizont

## Обзор

В проект добавлен Express + TypeScript сервер, который проксирует CRUD операции для отзывов, обжалований и аудита логов. Это предотвращает попадание Parse REST API ключа в браузерный бандл и позволяет централизованно управлять безопасностью.

### Структура сервера

```
server/
├── src/
│   ├── index.ts          # Express приложение с маршрутами
│   └── parseClient.ts    # node-fetch обёртка для Back4App
├── package.json
├── tsconfig.json
└── .env.example
```

### Эндпоинты

#### Публичные (без аутентификации)
- `POST /api/reviews` — создать отзыв
- `GET /api/reviews` — получить отзывы (с параметром `?where=...`)
- `POST /api/appeals` — подать обжалование

#### Защищённые (требуют `X-Admin-Secret`)
- `PUT /api/reviews/:id` — отредактировать отзыв
- `DELETE /api/reviews/:id` — удалить отзыв
- `PUT /api/appeals/:id` — разрешить/отклонить обжалование
- `GET /api/appeals` — получить список обжалований

#### Логирование
- `POST /api/audit` — записать запись в лог (публично)
- `GET /api/audit` — прочитать логи (требует `X-Admin-Secret`)

## Установка и запуск локально

### 1. Установить зависимости сервера

```powershell
cd server
npm install
```

### 2. Настроить переменные окружения

Скопируйте `.env.example` в `.env`:

```powershell
Copy-Item .env.example .env
```

Отредактируйте `.env` и укажите значения:

```
PARSE_APP_ID=your_back4app_app_id
PARSE_REST_KEY=your_back4app_rest_key
ADMIN_SECRET=your_secret_admin_key_e.g_somethinghard
PORT=4000
```

### 3. Запустить локальный сервер

```powershell
npm run dev
```

Сервер запустится на `http://localhost:4000`.

### 4. Запустить фронтенд в другом терминале

```powershell
cd ..  # вернуться в корень проекта
npm run dev
```

Фронтенд откроется на `http://localhost:3001`.

## Проверка работы

### Создать отзыв через прокси

Откройте DevTools (F12) в браузере и зайдите на страницу товара. Когда вы добавляете отзыв:

1. В консоли должно быть: `[createReview] Proxy failed...` если сервер не запущен → откат на Parse SDK/REST
2. Если сервер запущен и настроен правильно → должна быть успешная запись в `POST /api/reviews`

Проверьте Network tab в DevTools чтобы подтвердить что запросы идут на `/api/*`.

### Проверить модерацию (требует admin)

Откройте страницу Admin (`/admin`) и попробуйте отклонить обжалование. Браузер отправит запрос `PUT /api/appeals/:id` с заголовком `X-Admin-Secret`. Если ключ неверен — получите ошибку 403.

## Развёртывание на Render (production)

### 1. Развернуть фронтенд (как раньше)

1. Запушить код в GitHub
2. На Render создать Web Service, указать как раньше:
   - Build: `npm install`
   - Start: `npm run dev`
   - Environment variables: `VITE_PARSE_APP_ID`, `VITE_PARSE_JS_KEY`

### 2. Развернуть backend отдельно

1. На Render создать новый Web Service
2. Подключить тот же GitHub репозиторий
3. Выставить настройки:
   - **Name:** `gorizont-backend` (или другое имя)
   - **Environment:** Node
   - **Build Command:** `cd server && npm install && npm run build`
   - **Start Command:** `cd server && npm start`
   - **Root Directory:** `.` (или оставить пусто)

4. Добавить Environment Variables в Render:
   ```
   PARSE_APP_ID=<your_back4app_app_id>
   PARSE_REST_KEY=<your_back4app_rest_key>
   ADMIN_SECRET=<long_random_secret_string>
   PORT=4000
   ```

5. Develop → создать новый Service, выбрать backend, сохранить

### 3. Подключить фронтенд к бэкенду

На странице Render вашего **фронтенда** (Web Service):

1. Перейти в Settings → Environment
2. Добавить переменную (если нужна):
   ```
   VITE_API_URL=https://gorizont-backend.onrender.com
   ```
   
   Или просто положиться на то, что `/api/*` будут проксированы фронтенд-сервером (если у вас есть прокси в vite.config).

**Важно:** убедитесь что фронтенд может обращаться к бэкенду. Для этого в фронтенде в `services/back4appRest.ts` функция `proxyApiRequest` обращается к `/api/*` — значит, нужна либо:
- Фронтенд и бэкенд на одном хосте (один Render сервис)
- Или CORS настроенный на бэкенде
- Или прокси в vite.config.ts для разработки/production

### 4. Обновить vite.config.ts для production

Если фронтенд и бэкенд на разных Render сервисах, добавьте CORS в `server/src/index.ts`:

```typescript
import cors from 'cors';
app.use(cors());
```

И в `services/back4appRest.ts` обновите `proxyApiRequest` чтобы учитывать URL:

```typescript
async function proxyApiRequest(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
  const baseUrl = typeof window !== 'undefined' 
    ? (process.env.VITE_API_URL || '/api')  // или из env
    : '/api';
  const url = `${baseUrl}${path}`;
  // ... rest of code
}
```

## Безопасность

### REST API ключ никогда не попадает в браузер
- ✅ `PARSE_REST_KEY` хранится только в `server/.env`
- ✅ Фронтенд обращается к своему бэкенду, который прокси́рует к Parse
- ✅ Если бэкенд недоступен, автоматический откат на Parse SDK (если JS_KEY доступна)

### Admin-защита
- ✅ Защищённые операции требуют заголовок `X-Admin-Secret`
- ⚠️ В production замените на JWT или сессии вместо статического секрета
- ✅ Аудит логи записываются для всех операций

### Рекомендации для production
1. **Переместить `ADMIN_SECRET` на JWT:** вместо статического ключа используйте JWT токены, выданные при входе администратора
2. **Добавить rate limiting:** используйте `express-rate-limit` для защиты от DDoS
3. **Логировать все операции:** всё логируется в `AuditLog` класс Parse
4. **Использовать HTTPS:** в production оба сервиса должны быть на HTTPS
5. **CORS:** более строгая настройка CORS вместо `cors()` по умолчанию

## Откат на Parse SDK

Если сервер недоступен или вернул ошибку, фронтенд автоматически откатывается на прямой Parse REST или Parse JS SDK:

```typescript
// Из back4appRest.ts
try {
  const proxied = await proxyApiRequest('/reviews', 'POST', data);
  return proxied;
} catch (err) {
  console.warn('[createReview] Proxy failed, falling back to direct Parse REST:', err);
  // продолжает выполняться с Parse SDK или parseRequest
}
```

Это обеспечивает бесперебойное функционирование приложения даже если бэкенд дауну.

## Дальнейшие улучшения

1. **Database:**
   - Переместить Session и AuditLog логи на выделённую БД (PostgreSQL) вместо Back4App
   - Это позволит лучше контролировать доступ и аудит

2. **Аутентификация:**
   - Реализовать JWT для админов вместо статического секрета
   - Добавить 2FA для модераторов

3. **Мониторинг:**
   - Логировать все запросы на бэкенде (структурированно)
   - Алерты при подозрительной активности

4. **Масштабирование:**
   - Если traffic растёт — перейти на более выгодный хостинг (Railway, Fly.io)
   - Кэширование отзывов (Redis)

## Заключение

Теперь ваша модерация, отзывы и аудит логи идут через защищённый backend, который контролирует доступ и логирует действия. Parse REST API ключ больше не попадает в браузерный бандл, что является лучшей практикой для production систем.
