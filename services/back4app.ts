import Parse from 'parse';
import { getEnvConfig } from '../env-config';

// Emit event when session expires (403 from server)
// This allows UI components to react without being tightly coupled to this module
export function notifySessionExpired(clearLocal = true) {
  if (typeof window !== 'undefined') {
    // Optionally clear localStorage when requested
    if (clearLocal) {
      localStorage.removeItem('market_user');
    }

    // Emit event so UI components can react (e.g., UserContext will also clear its state)
    const event = new CustomEvent('sessionExpired', {
      detail: { message: 'Ваша сессия истекла. Пожалуйста, войдите снова.' }
    });
    window.dispatchEvent(event);
    console.warn('[SessionExpired] Notified UI' + (clearLocal ? ' and cleared localStorage' : ' (localStorage preserved)'));
  }
}

// Инициализация Parse / Back4App
export function initializeParse(appId?: string, jsKey?: string) {
  // Получить ключи из разных источников (приоритет):
  // 1. Параметры функции
  // 2. env-config.ts (который читает из window или import.meta)
  // 3. Fallback пусто
  
  let APP_ID = appId;
  let JS_KEY = jsKey;
  
  // Если не переданы параметры, попробовать получить из env-config
  if (!APP_ID || !JS_KEY) {
    const envConfig = getEnvConfig();
    if (!APP_ID) APP_ID = envConfig.appId;
    if (!JS_KEY) JS_KEY = envConfig.jsKey;
  }

  // Debug logging
  console.log('[Parse Init] APP_ID present:', !!APP_ID);
  console.log('[Parse Init] JS_KEY present:', !!JS_KEY);
  if (!APP_ID) console.error('[Parse Init] Warning: APP_ID is empty!');
  if (!JS_KEY) console.error('[Parse Init] Warning: JS_KEY is empty!');

  if (!APP_ID || !JS_KEY) {
    // eslint-disable-next-line no-console
    console.error('❌ Parse не инициализирован! Отсутствуют APP_ID или JS_KEY');
    // eslint-disable-next-line no-console
    console.warn('Требуются переменные окружения VITE_PARSE_APP_ID и VITE_PARSE_JS_KEY');
    // Все равно инициализируем с пустыми ключами, чтобы не сломать приложение
    // (но операции с БД не будут работать)
    try {
      Parse.initialize(APP_ID || 'dummy', JS_KEY || 'dummy');
      Parse.serverURL = 'https://parseapi.back4app.com';
    } catch (e) {
      console.error('[Parse Init] Error initializing with dummy keys:', e);
    }
    return;
  }

  try {
    Parse.initialize(APP_ID, JS_KEY);
    Parse.serverURL = 'https://parseapi.back4app.com';
    
    // eslint-disable-next-line no-console
    console.info('✅ Parse инициализирован успешно');
  } catch (e: any) {
    // Parse SDK может выбросить ошибку из-за LiveQuery, но это OK - основной функционал работает
    if (e?.message?.includes('Emitter') || e?.message?.includes('EventEmitter')) {
      console.warn('[Parse Init] LiveQuery initialization error (expected in browser):', e.message);
      // Пробуем инициализировать без LiveQuery
      try {
        Parse.initialize(APP_ID, JS_KEY);
        Parse.serverURL = 'https://parseapi.back4app.com';
        console.info('✅ Parse инициализирован успешно (без LiveQuery)');
      } catch (e2) {
        console.error('[Parse Init] Failed to initialize Parse:', e2);
      }
    } else {
      console.error('[Parse Init] Unexpected error during initialization:', e);
    }
  }
}

// Восстановление сессии из localStorage после инициализации
export async function restoreSession(options: { clearLocalOnFail?: boolean; emitEventOnFail?: boolean } = {}): Promise<boolean> {
  const { clearLocalOnFail = true, emitEventOnFail = true } = options;
  try {
    // Проверяем что Parse инициализирован
    if (!Parse.applicationId) {
      console.warn('[RestoreSession] Parse not initialized, skipping session restore');
      return false;
    }

    const saved = localStorage.getItem('market_user');
    if (saved) {
      const user = JSON.parse(saved);
      if (user.sessionToken && user.objectId) {
        // Use the session token to restore the current user
        // Parse.User.become() will validate the session token with the server
        await Parse.User.become(user.sessionToken);
        // eslint-disable-next-line no-console
        console.info('✅ Parse session restored from sessionToken');
        return true;
      }
    }
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.warn('Failed to restore Parse session:', e);

    // If we got an authentication error (401/403 equivalent), the token is invalid.
    // Optionally remove it from localStorage so we don't keep trying to use a dead token.
    if (e?.message?.includes('unauthorized') || e?.code === 101 || e?.status === 403) {
      console.warn('[RestoreSession] Token is invalid (401/403)');
      if (clearLocalOnFail) {
        console.warn('[RestoreSession] Clearing localStorage due to invalid token');
        localStorage.removeItem('market_user');
      }
      // Emit sessionExpired event so UI components can react if requested
      if (emitEventOnFail) notifySessionExpired(clearLocalOnFail);
    }
  }
  return false;
}

// --- Примеры CRUD для класса GameScore ---
export async function createGameScore(score: number, playerName: string, cheatMode = false) {
  const GameScore = new Parse.Object('GameScore');
  GameScore.set('score', score);
  GameScore.set('playerName', playerName);
  GameScore.set('cheatMode', cheatMode);
  return await GameScore.save();
}

export async function queryGameScores(minScore = 0) {
  const query = new Parse.Query('GameScore');
  query.greaterThan('score', minScore);
  return await query.find();
}

export async function updateGameScore(objectId: string, fields: Record<string, any>) {
  const query = new Parse.Query('GameScore');
  const obj = await query.get(objectId);
  Object.keys(fields).forEach(key => obj.set(key, fields[key]));
  return await obj.save();
}

export async function deleteGameScore(objectId: string) {
  const query = new Parse.Query('GameScore');
  const obj = await query.get(objectId);
  return await obj.destroy();
}

export default {
  initializeParse,
  createGameScore,
  queryGameScores,
  updateGameScore,
  deleteGameScore,
};
