# Примеры кода: Session Restoration Implementation

## 1. Инициализация Parse SDK

### ✅ Правильный способ (services/back4app.ts)

```typescript
import Parse from 'parse';

export function initializeParse(appId?: string, jsKey?: string) {
  const APP_ID = appId || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PARSE_APP_ID) || '';
  const JS_KEY = jsKey || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PARSE_JS_KEY) || '';

  if (!APP_ID || !JS_KEY) {
    console.warn('Parse не инициализирован: не заданы APP_ID или JS_KEY');
    return;
  }

  // Инициализация Parse SDK
  Parse.initialize(APP_ID, JS_KEY);
  Parse.serverURL = 'https://parseapi.back4app.com';
  console.info('Parse инициализирован');
}
```

**Что это делает:**
- Получает APP_ID и JS_KEY из переменных окружения
- Инициализирует Parse SDK с этими ключами
- Устанавливает serverURL на Back4App

---

## 2. Восстановление SessionToken

### ✅ Правильный способ (services/back4app.ts)

```typescript
export async function restoreSession(): Promise<boolean> {
  try {
    // Получить сохраненного пользователя из localStorage
    const saved = localStorage.getItem('market_user');
    
    if (saved) {
      const user = JSON.parse(saved);
      
      // Проверить что есть sessionToken и objectId
      if (user.sessionToken && user.objectId) {
        // Восстановить сессию используя sessionToken
        // Parse.User.become() валидирует токен с Back4App
        await Parse.User.become(user.sessionToken);
        
        console.info('✅ Parse session restored from sessionToken');
        return true;
      }
    }
  } catch (e) {
    // Если sessionToken невалиден или истек
    console.warn('Failed to restore Parse session:', e);
    
    // Удалить пользователя из localStorage
    localStorage.removeItem('market_user');
  }
  
  return false;
}
```

**Процесс:**
1. Читает `market_user` из localStorage
2. Извлекает sessionToken из сохраненного пользователя
3. Вызывает `Parse.User.become(sessionToken)` для валидации с Back4App
4. Если успешно - Parse.User.current() будет содержать пользователя
5. Если ошибка - очищает localStorage и возвращает false

---

## 3. Вызов из главного компонента

### ✅ Правильный способ (App.tsx)

```typescript
import { initializeParse, restoreSession } from './services/back4app';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Инициализируем Parse SDK
    initializeParse();
    
    // Восстанавливаем сессию из localStorage
    restoreSession()
      .then((restored) => {
        if (restored) {
          console.log('✅ User session restored successfully');
        } else {
          console.log('ℹ️ No valid session to restore');
        }
      })
      .catch((e) => {
        console.error('Error during session restoration:', e);
      });
  }, []);

  // ... остальной код компонента
};

export default App;
```

**Ключевые моменты:**
- Вызывается в `useEffect` с пустым зависимостей массивом `[]`
- Это гарантирует выполнение только один раз при монтировании
- Логирование помогает отследить процесс восстановления
- Обработка ошибок предотвращает краши при невалидном токене

---

## 4. Автоматическое получение SessionToken

### ✅ Правильный способ (services/back4appRest.ts)

```typescript
export async function uploadFile(file: File, sessionToken?: string) {
  if (!isInitialized()) {
    throw new Error('Back4App not initialized');
  }

  // Если sessionToken не передан, получить из текущего пользователя
  if (!sessionToken) {
    try {
      const currentUser = Parse.User.current();
      if (currentUser) {
        sessionToken = currentUser.getSessionToken();
      }
    } catch {}
  }

  // Подготовка заголовков
  const headers: Record<string, string> = {
    'X-Parse-Application-Id': PARSE_APP_ID,
    'X-Parse-REST-API-Key': PARSE_REST_KEY,
    'Content-Type': file.type || 'application/octet-stream',
  };
  
  // Добавить sessionToken если доступен
  if (sessionToken) {
    headers['X-Parse-Session-Token'] = sessionToken;
  }

  // Выполнить запрос
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: file,
  });

  // ... обработка ответа
}
```

**Автоматизация:**
- Если sessionToken не передан явно, функция получает его из Parse.User.current()
- Это означает что после восстановления сессии, все операции работают автоматически
- Не нужно передавать sessionToken вручную при каждом вызове

---

## 5. Проверка аутентификации

### ✅ Правильный способ (services/back4appRest.ts)

```typescript
export function isUserAuthenticated(): boolean {
  try {
    const currentUser = Parse.User.current();
    // Проверить что пользователь есть И есть sessionToken
    return !!currentUser && !!currentUser.getSessionToken();
  } catch {
    return false;
  }
}
```

**Использование в компонентах:**

```typescript
// В компоненте, требующем аутентификации
import back4appRest from './services/back4appRest';

function MyComponent() {
  if (!back4appRest.isUserAuthenticated()) {
    return <div>Пожалуйста авторизуйтесь</div>;
  }

  return <div>Вы авторизованы!</div>;
}
```

---

## 6. Обработка ошибок sessionToken

### ✅ Как обработать истекший токен

```typescript
// В restoreSession()
try {
  await Parse.User.become(sessionToken);
} catch (error: any) {
  // Проверить тип ошибки
  if (error.code === 'INVALID_SESSION_TOKEN') {
    // sessionToken невалиден или истек
    console.log('Session token invalid or expired');
    localStorage.removeItem('market_user');
    // Redirected to login will happen automatically via router
  } else {
    // Другая ошибка (может быть сетевая)
    console.error('Unexpected error:', error);
  }
}
```

---

## 7. Интеграция с UserContext

### ✅ Синхронизация между contexts

```typescript
// services/back4app.ts
export async function loginAndStore(username: string, password: string) {
  try {
    // Авторизовать в Parse
    const user = await Parse.User.logIn(username, password);
    
    // Получить данные пользователя
    const userData = {
      objectId: user.id,
      username: user.get('username'),
      email: user.get('email'),
      sessionToken: user.getSessionToken(),
      // ... другие поля
    };
    
    // Сохранить в localStorage (UserContext затем подхватит)
    localStorage.setItem('market_user', JSON.stringify(userData));
    
    return userData;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
```

### Использование в компоненте Login

```typescript
// pages/Login.tsx
const handleLogin = async (username: string, password: string) => {
  try {
    const userData = await loginAndStore(username, password);
    
    // UserContext обновляет свое состояние
    login(userData);
    
    // Redirect to home
    navigate('/');
  } catch (error) {
    setError('Login failed');
  }
};
```

---

## 8. Переменные окружения

### ✅ Правильная конфигурация (.env.local)

```bash
# .env.local

# Обязательные для Parse SDK инициализации
VITE_PARSE_APP_ID=XLiNP1abc123...
VITE_PARSE_JS_KEY=abcdefg123456...

# Опционально (для серверных операций)
VITE_PARSE_REST_KEY=tijJJ1234567...
```

### ✅ Конфигурация Vite (vite.config.ts)

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    __VITE_PARSE_APP_ID__: JSON.stringify(process.env.VITE_PARSE_APP_ID),
    __VITE_PARSE_JS_KEY__: JSON.stringify(process.env.VITE_PARSE_JS_KEY),
  },
});
```

---

## 9. Полный цикл: Login → Store → Restore

```typescript
// ╔════════════════════════════════════════════════════════════════╗
// ║                        ЦИКЛ СЕССИИ                             ║
// ╚════════════════════════════════════════════════════════════════╝

// ШАГИ 1-3: АВТОРИЗАЦИЯ И СОХРАНЕНИЕ

// 1️⃣ Пользователь логинится (Login.tsx)
const response = await back4appRest.loginUser(username, password);
// response = { objectId, username, email, sessionToken, ... }

// 2️⃣ UserContext сохраняет в localStorage
localStorage.setItem('market_user', JSON.stringify(response));

// 3️⃣ UserContext обновляет React state
setUser(response);

// ════════════════════════════════════════════════════════════════

// ШАГИ 4-6: ПЕРЕЗАГРУЗКА И ВОССТАНОВЛЕНИЕ

// 4️⃣ Пользователь нажимает F5 (браузер перезагружается)

// 5️⃣ App.tsx useEffect вызывается (на загрузке)
useEffect(() => {
  initializeParse();        // ← Инициализируем Parse SDK
  restoreSession()          // ← Восстанавливаем sessionToken
    .then(restored => {
      if (restored) {
        // Parse.User.current() теперь содержит пользователя
      }
    });
}, []);

// 6️⃣ UserContext также восстанавливает из localStorage
useEffect(() => {
  const saved = localStorage.getItem('market_user');
  if (saved) {
    setUser(JSON.parse(saved));
  }
}, []);

// ════════════════════════════════════════════════════════════════

// ШАГИ 7-8: ИСПОЛЬЗОВАНИЕ И ОПЕРАЦИИ

// 7️⃣ Пользователь выполняет действие требующее auth
const result = await uploadFile(file);
// uploadFile автоматически получит sessionToken из Parse.User.current()

// 8️⃣ Файл загружается с заголовком X-Parse-Session-Token
// ✅ Успешно!

// ════════════════════════════════════════════════════════════════
```

---

## 10. Логирование и отладка

### ✅ Полезные логи для отладки

```typescript
// В services/back4app.ts
export function debugSession() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  SESSION DEBUG INFO                    ║');
  console.log('╚════════════════════════════════════════╝');
  
  // 1. localStorage
  const stored = localStorage.getItem('market_user');
  console.log('localStorage.market_user:', stored ? JSON.parse(stored) : 'NOT FOUND');
  
  // 2. Parse SDK
  const user = Parse.User.current();
  console.log('Parse.User.current():', user);
  
  // 3. SessionToken
  if (user) {
    console.log('SessionToken:', user.getSessionToken());
  }
  
  // 4. Parse SDK Status
  console.log('Parse.serverURL:', Parse.serverURL);
  
  console.log('╚════════════════════════════════════════╝');
}

// Использование:
// В консоли браузера:
// debugSession()
```

---

## 11. Обработка сетевых ошибок

### ✅ Graceful degradation

```typescript
export async function restoreSession(): Promise<boolean> {
  try {
    const saved = localStorage.getItem('market_user');
    if (!saved) return false;
    
    const user = JSON.parse(saved);
    if (!user.sessionToken) return false;
    
    try {
      // Попытаться валидировать с Back4App
      await Parse.User.become(user.sessionToken);
      console.info('✅ Session restored from Back4App');
      return true;
    } catch (backendError) {
      // Back4App недоступен или token невалиден
      
      // Если это сетевая ошибка, попробовать использовать местное состояние
      if (navigator.onLine === false) {
        console.warn('Offline: Using cached session');
        // Можно использовать cached session для offline mode
        return true;
      }
      
      // Если это невалидный token, очистить
      if (backendError.message.includes('invalid')) {
        localStorage.removeItem('market_user');
        return false;
      }
      
      throw backendError;
    }
  } catch (error) {
    console.error('Session restoration failed:', error);
    return false;
  }
}
```

---

## Резюме: Ключевые вызовы функций

```
┌─────────────────────────────────────────────┐
│ Где вызывается что                          │
├─────────────────────────────────────────────┤
│                                             │
│ App.tsx (useEffect):                       │
│  ├─ initializeParse()     ← При загрузке   │
│  └─ restoreSession()      ← При загрузке   │
│                                             │
│ Login.tsx (handleLogin):                   │
│  ├─ loginAndStore()       ← При логине     │
│  └─ login() (context)     ← Сохрани state  │
│                                             │
│ uploadFile():                              │
│  ├─ sessionToken =        ← Получить из    │
│  │   Parse.User.current() │   Parse SDK    │
│  └─ fetch(...headers)     ← Отправить      │
│                                             │
│ isUserAuthenticated():                     │
│  └─ Parse.User.current()  ← Проверить     │
│                                             │
└─────────────────────────────────────────────┘
```

---

Это полный набор примеров для реализации и отладки session restoration! 🚀
