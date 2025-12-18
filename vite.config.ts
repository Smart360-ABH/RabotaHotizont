import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to inject env vars into global scope
function envInjectorPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'env-injector',
    apply: 'serve',
    transformIndexHtml: {
      order: 'pre',
      handler(html: string) {
        // Inject environment variables into the HTML before it's served
        const envScript = `
<script>
  window.__VITE_PARSE_APP_ID__ = ${JSON.stringify(env.VITE_PARSE_APP_ID || '')};
  window.__VITE_PARSE_JS_KEY__ = ${JSON.stringify(env.VITE_PARSE_JS_KEY || '')};
  window.__VITE_PARSE_REST_KEY__ = ${JSON.stringify(env.VITE_PARSE_REST_KEY || '')};
  window.__VITE_API_KEY__ = ${JSON.stringify(env.VITE_API_KEY || '')};
</script>
        `;
        return html.replace('<head>', '<head>' + envScript);
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');

  // Build-time defines. Also expose via window for dev server.
  const defines: Record<string, string> = {
    '__VITE_PARSE_APP_ID__': JSON.stringify(env.VITE_PARSE_APP_ID || ''),
    '__VITE_PARSE_JS_KEY__': JSON.stringify(env.VITE_PARSE_JS_KEY || ''),
    '__VITE_API_KEY__': JSON.stringify(env.VITE_API_KEY || ''),
  };

  if (env.VITE_PARSE_REST_KEY) {
    defines['__VITE_PARSE_REST_KEY__'] = JSON.stringify(env.VITE_PARSE_REST_KEY);
  }

  // Логирование для отладки (удалить в production)
  console.error('[Vite] APP_ID loaded:', !!env.VITE_PARSE_APP_ID);
  console.error('[Vite] JS_KEY loaded:', !!env.VITE_PARSE_JS_KEY);

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: [
        'market-syrc.onrender.com'
      ],
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [envInjectorPlugin(env), react()],
    define: defines,
    preview: {
      allowedHosts: [
        'market-qk85.onrender.com',
        'gorizont-fe04.onrender.com'
      ]
    },
    resolve: {
      alias: {
        '@': path.resolve('.'),
        // Ensure the 'events' package (EventEmitter) is resolved to the npm
        // polyfill instead of being externalized by Vite. This prevents the
        // Parse SDK from failing when it expects EventEmitter in browser.
        events: 'events',
      }
    },
    optimizeDeps: {
      // Pre-bundle parse and events to avoid Vite externalization/runtime issues
      include: ['parse', 'events'],
    },
    ssr: {
      // Prevent parse from being treated as external during SSR builds
      noExternal: ['parse']
    },
    build: {
      chunkSizeWarningLimit: 2000
    }
  };
});