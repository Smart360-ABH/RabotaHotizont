/**
 * Environment configuration for browser
 * This file reads environment variables from multiple sources:
 * 1. window.__VITE_* (injected by vite.config.ts)
 * 2. import.meta.env (Vite dev mode)
 * 3. Falls back to empty strings
 */

export const getEnvConfig = () => {
  const appId = 
    (typeof window !== 'undefined' && (window as any).__VITE_PARSE_APP_ID__) ||
    (import.meta.env?.VITE_PARSE_APP_ID) ||
    '';
  
  const jsKey =
    (typeof window !== 'undefined' && (window as any).__VITE_PARSE_JS_KEY__) ||
    (import.meta.env?.VITE_PARSE_JS_KEY) ||
    '';
  
  const restKey =
    (typeof window !== 'undefined' && (window as any).__VITE_PARSE_REST_KEY__) ||
    (import.meta.env?.VITE_PARSE_REST_KEY) ||
    '';
  
  const apiKey =
    (typeof window !== 'undefined' && (window as any).__VITE_API_KEY__) ||
    (import.meta.env?.VITE_API_KEY) ||
    '';

  // Log what we found
  if (typeof window !== 'undefined') {
    console.log('[EnvConfig] App ID source:', 
      (window as any).__VITE_PARSE_APP_ID__ ? 'window.__VITE_PARSE_APP_ID__' : 
      import.meta.env?.VITE_PARSE_APP_ID ? 'import.meta.env' : 'fallback (empty)');
  }

  return {
    appId,
    jsKey,
    restKey,
    apiKey,
  };
};

export default getEnvConfig();
