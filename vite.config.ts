import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      },
      // Optimize dependencies for Parse SDK
      optimizeDeps: {
        include: ['parse'],
        esbuildOptions: {
          define: {
            global: 'globalThis'
          }
        }
      }
      ,
      build: {
        // disable sourcemaps in production to reduce build size
        sourcemap: false,
        // increase warning limit to focus on real issues; chunking will try to reduce sizes
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
          output: {
            manualChunks(id: string) {
              if (id.includes('node_modules')) {
                if (id.includes('parse')) return 'vendor_parse';
                if (id.includes('@google/genai')) return 'vendor_genai';
                if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('recharts') || id.includes('lucide-react')) return 'vendor_react';
                return 'vendor_misc';
              }
            }
          }
        }
      }
    };
});