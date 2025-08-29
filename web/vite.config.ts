import { fileURLToPath, URL } from 'node:url';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import removeConsole from 'vite-plugin-remove-console';

const dropConsole = process.env.VITE_ALLOW_CONSOLE_LOGS !== 'true';
console.log(dropConsole ? 'WARN: Console logs are disabled' : 'INFO: Console logs are enabled');

const assetsDir = path.join(__dirname, '../api/dev/webGui/');

/**
 * Used to avoid redeclaring variables in the webgui codebase.
 */
function terserReservations(inputStr: string) {
  const combinations = ['ace'];

  // Add 1-character combinations
  for (let i = 0; i < inputStr.length; i++) {
    combinations.push(inputStr[i]);
  }

  // Add 2-character combinations
  for (let i = 0; i < inputStr.length; i++) {
    for (let j = 0; j < inputStr.length; j++) {
      combinations.push(inputStr[i] + inputStr[j]);
    }
  }

  return combinations;
}

const charsToReserve = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Shared terser options for consistent minification
 */
const sharedTerserOptions = {
  mangle: {
    reserved: terserReservations(charsToReserve),
    toplevel: true,
  },
};

/**
 * Shared define configuration
 */
const sharedDefine = {
  'globalThis.__DEV__': process.env.NODE_ENV === 'development',
  __VUE_PROD_DEVTOOLS__: false,
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue({
      template: {
        compilerOptions: {
          // Treat all unraid-* components as custom elements
          isCustomElement: (tag) => tag.startsWith('unraid-')
        }
      }
    }),
    // Remove console logs in production
    ...(dropConsole ? [
      removeConsole({
        includes: ['log', 'info', 'debug'],
      })
    ] : []),
    // Add Nuxt UI vite plugin for Vue mode
    (async () => {
      const { default: NuxtUIVite } = await import('@nuxt/ui/vite');
      return NuxtUIVite({
        colorMode: true
      });
    })()
  ],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      '~/': fileURLToPath(new URL('./', import.meta.url)),
    },
  },

  define: sharedDefine,

  build: {
    minify: 'terser',
    terserOptions: sharedTerserOptions,
  },

  server: {
    port: 3000,
    proxy: {
      '/graphql': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        secure: false,
        // Important: preserve the host header
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('X-Forwarded-Host', 'localhost:3000');
            proxyReq.setHeader('X-Forwarded-Proto', 'http');
            proxyReq.setHeader('X-Forwarded-For', '127.0.0.1');
          });
        },
      },
      '/webGui': {
        target: `file://${assetsDir}`,
        changeOrigin: true,
      },
    },
  },
});