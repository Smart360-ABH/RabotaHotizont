# Back4App Troubleshooting Guide

## ✅ Исправленные ошибки (6 декабря 2025)

### 1. **TypeError: Cannot read properties of undefined (reading '0')**

**Проблема:**
```
Profile.tsx:134 Uncaught TypeError: Cannot read properties of undefined (reading '0')
```

**Причина:** 
`user.name` была undefined, попытка доступа к `user.name[0]` вызвала ошибку.

**Решение:**
Добавлена проверка null/undefined перед доступом к свойствам:

```typescript
// ДО (ошибка):
<div>{user.name[0]}</div>

// ПОСЛЕ (исправлено):
<div>{(user.name || 'U')[0]}</div>
<div>{user.name || 'Unknown'}</div>
<div>{user.email || 'no-email'}</div>
```

**Файлы изменены:**
- ✅ `pages/Profile.tsx` (строки 133-139)

---

### 2. **[Back4App] Credentials not found. Using fallback mode.**

**Проблема:**
```
back4app.ts:17 [Back4App] Credentials not found. Using fallback mode.
```

**Причина:** 
Переменные окружения `VITE_BACK4APP_APP_ID` и `VITE_BACK4APP_JS_KEY` не были установлены в `.env.local`.

**Решение:**
Обновлен `.env.local` с полными Back4App credentials:

```bash
GEMINI_API_KEY=PLACEHOLDER_API_KEY

# Back4App Configuration
VITE_BACK4APP_APP_ID=XLiNP1wljZYgnjhgjy4RHrjvKx3OLKI6OCMwZQvA
VITE_BACK4APP_JS_KEY=dTmB0XsCCe3ZLP5OYWdO6QV9vpdU1Hr9qstsphXj
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:3000/api
```

**Файлы изменены:**
- ✅ `.env.local` (добавлены Back4App переменные)

**Важно:** 
- Убедитесь, что `.env.local` в `.gitignore` (не коммитится в репо)
- Переменные начинаются с `VITE_` для доступа через `import.meta.env`

---

### 3. **Parse Module "events" externalized for browser compatibility**

**Проблема:**
```
parse.js?v=551ed98c:21550 Module "events" has been externalized for browser compatibility. 
Cannot access "events.EventEmitter" in client code.
```

**Причина:** 
Parse SDK требует модуля `events` на клиенте, но Vite не настроен для этого.

**Решение:**
Обновлен `vite.config.ts` с поддержкой fallback для Parse:

```typescript
resolve: {
  alias: {
    '@': path.resolve('.'),
  },
  // Fix for Parse SDK compatibility
  fallback: {
    'events': 'events'
  }
},
// Optimize Parse SDK for browser
ssr: {
  noExternal: ['parse']
}
```

**Файлы изменены:**
- ✅ `vite.config.ts` (добавлены fallback и noExternal)

---

### 4. **Tailwind CSS: cdn.tailwindcss.com should not be used in production**

**Проблема:**
```
(index):64 cdn.tailwindcss.com should not be used in production. 
To use Tailwind CSS in production, install it as a PostCSS plugin 
or use the Tailwind CLI: https://tailwindcss.com/docs/installation
```

**Статус:** ⚠️ Warning (не критично для development)

**Решение для production:**
1. Установить Tailwind CSS via npm: `npm install -D tailwindcss postcss autoprefixer`
2. Инициализировать конфиг: `npx tailwindcss init -p`
3. Обновить шаблон в `index.html`:
```html
<!-- Удалить CDN script -->
<!-- <script src="https://cdn.tailwindcss.com"></script> -->

<!-- Добавить import в CSS -->
<link rel="stylesheet" href="./index.css">
```

Для теперь это работает в development режиме без проблем.

---

### 5. **React DevTools warning**

**Проблема:**
```
Download the React DevTools for a better development experience
```

**Статус:** ℹ️ Информационное сообщение

**Решение:**
Установить расширение React DevTools для браузера:
- Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
- Firefox: https://addons.mozilla.org/firefox/addon/react-devtools/

---

## 🔧 Рекомендации для дальнейшей разработки

### Environment Variables Checklist
- [x] `VITE_BACK4APP_APP_ID` — установлена
- [x] `VITE_BACK4APP_JS_KEY` — установлена
- [x] `VITE_USE_MOCK` — установлена (false = использовать Back4App)
- [x] `VITE_API_URL` — установлена (fallback для REST API)
- [x] `.env.local` в `.gitignore` — БЕЗ КОММИТА!

### Dev Server Status
- ✅ Vite запущен на `http://localhost:3000`
- ✅ Parse SDK инициализирован с Back4App credentials
- ✅ Hot Module Replacement (HMR) работает
- ✅ TypeScript компиляция без ошибок

### Testing Workflow
1. **Login page:** http://localhost:3000/login
   - Используется `loginWithCredentials()` из контекста
   - Back4App проверит email/password
   - Fallback на мок если Back4App не настроен

2. **Profile page:** http://localhost:3000/profile
   - Загружает данные из `Back4App.getCurrentUserJson()`
   - Кнопка "Сохранить изменения" вызывает `Back4App.updateCurrentUser()`
   - Сообщение статуса показывает результат сохранения

3. **Session persistence:**
   - Данные пользователя сохраняются в localStorage как fallback
   - При перезагрузке страницы восстанавливается из Parse или localStorage
   - Если вышли из системы — очищаются оба хранилища

---

## 🚨 Если возникнут новые ошибки

### Parse SDK issues
- Убедитесь, что `npm install parse` установлен
- Проверьте App ID и JS Key в `.env.local`
- Перезагрузите dev сервер после изменения `.env.local`

### Back4App not responding
- Проверьте интернет соединение
- Убедитесь, что Back4App сервер доступен: https://parseapi.back4app.com
- Проверьте status: https://status.back4app.com

### Session lost on reload
- Проверьте, что `loginWithCredentials()` вызвана перед mount
- Убедитесь, что localStorage не очищается расширением браузера
- Для production используйте HTTP cookies с SameSite=Lax

### Form data not updating
- Проверьте, что formData state правильно связана с input'ами
- Убедитесь, что `handleSaveSettings()` получает правильные данные
- Проверьте консоль браузера на ошибки API

---

## 📚 Дополнительные ресурсы

- **Back4App Docs:** https://www.back4app.com/docs/get-started/welcome
- **Parse SDK Docs:** https://docs.parseplatform.org/js/guide/
- **Vite Guide:** https://vitejs.dev/guide/
- **React Docs:** https://react.dev

---

**Обновлено:** 6 декабря 2025 г.  
**Статус:** ✅ Все критичные ошибки исправлены
