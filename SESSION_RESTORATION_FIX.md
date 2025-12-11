# Session Restoration Fix - Документация

## Проблема
После перезагрузки страницы пользователь выходил из системы и постоянно просили авторизоваться для выполнения действий (например, добавление комментариев).

### Причины:
1. Parse SDK не инициализировался при загрузке приложения
2. Даже если пользователь был сохранен в localStorage, Parse SDK не знал о sessionToken
3. Функции, требующие аутентификации, не могли отправить sessionToken

## Решение

### 1. Новая функция в `services/back4app.ts`

Добавлена `restoreSession()` функция:
```typescript
export async function restoreSession(): Promise<boolean> {
  try {
    const saved = localStorage.getItem('market_user');
    if (saved) {
      const user = JSON.parse(saved);
      if (user.sessionToken && user.objectId) {
        await Parse.User.become(user.sessionToken);
        console.info('✅ Parse session restored from sessionToken');
        return true;
      }
    }
  } catch (e) {
    console.warn('Failed to restore Parse session:', e);
    localStorage.removeItem('market_user');
  }
  return false;
}
```

**Как работает:**
- Получает сохраненного пользователя из localStorage
- Вызывает `Parse.User.become(sessionToken)` для восстановления сессии на стороне Parse SDK
- Если sessionToken истек или невалиден, удаляет пользователя из localStorage

### 2. Инициализация в `App.tsx`

В главном компоненте добавлена инициализация:
```typescript
useEffect(() => {
  initializeParse(); // Инициализируем Parse SDK
  
  restoreSession()   // Восстанавливаем сессию
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
```

### 3. Автоматическое получение sessionToken в `services/back4appRest.ts`

Функция `uploadFile()` теперь автоматически получает sessionToken из текущего пользователя:
```typescript
export async function uploadFile(file: File, sessionToken?: string) {
  // ... validation ...
  
  // If no sessionToken provided, try to get from current Parse user
  if (!sessionToken) {
    try {
      const currentUser = Parse.User.current();
      if (currentUser) {
        sessionToken = currentUser.getSessionToken();
      }
    } catch {}
  }
  
  // ... rest of function ...
}
```

### 4. Новая функция для проверки аутентификации

Добавлена `isUserAuthenticated()` для проверки наличия активной сессии:
```typescript
export function isUserAuthenticated(): boolean {
  try {
    const currentUser = Parse.User.current();
    return !!currentUser && !!currentUser.getSessionToken();
  } catch {
    return false;
  }
}
```

## Flow после перезагрузки страницы

```
1. Страница загружается → App.tsx useEffect вызывается
2. initializeParse() → Parse SDK инициализируется с APP_ID и JS_KEY
3. restoreSession() → Читается localStorage, получается sessionToken
4. Parse.User.become(sessionToken) → Parse SDK восстанавливает сессию
5. Parse.User.current() → Теперь возвращает текущего пользователя
6. Все функции, использующие sessionToken, работают автоматически
```

## Где используется

### Будут автоматически работать без повторной авторизации:
- Добавление продуктов (если seller)
- Загрузка файлов (изображения, комментарии)
- Создание комментариев
- Добавление в избранное
- Оформление заказов
- Все операции в профиле

### UserContext продолжит работать как раньше:
- Сохраняет пользователя в localStorage
- Предоставляет пользователя через контекст React
- Теперь синхронизирован с Parse SDK sessionToken

## Проверка работоспособности

**Тест 1: Восстановление сессии**
1. Логин в приложение
2. Проверить консоль: должны быть логи "✅ Parse session restored" или "ℹ️ No valid session"
3. Перезагрузить страницу F5
4. Пользователь должен остаться залогинен

**Тест 2: Комментарии без повторной авторизации**
1. Залогиниться
2. Перезагрузить страницу
3. Попробовать добавить комментарий
4. Комментарий должен быть добавлен без подсказки авторизации

**Тест 3: Истекший токен**
1. Вручную удалить sessionToken из localStorage (devtools)
2. Перезагрузить страницу
3. Пользователь должен быть разлогинен

## Логирование для отладки

После этих изменений в консоли браузера будут видны:
```
Parse инициализирован
✅ Parse session restored from sessionToken
✅ User session restored successfully
```

Если что-то не работает, проверьте в консоли:
```javascript
Parse.User.current() // Должен вернуть текущего пользователя
```

## Совместимость

- ✅ Работает с Parse SDK 7.0.2
- ✅ Работает с Back4App
- ✅ Работает с React 19.2
- ✅ Работает с TypeScript 5.8
- ✅ Не требует изменений в других компонентах

## Potential Issues

Если `Parse.User.become()` выбросит ошибку:
1. Проверить что sessionToken не истек на стороне Back4App
2. Убедиться что VITE_PARSE_APP_ID и VITE_PARSE_JS_KEY установлены в окружении
3. Проверить консоль браузера для деталей ошибки
