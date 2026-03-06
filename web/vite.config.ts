import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import ui from '@nuxt/ui/vite';

import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import removeConsole from 'vite-plugin-remove-console';

import scopeTailwindToUnapi from './postcss/scopeTailwindToUnapi';
import { serveStaticHtml } from './vite-plugin-serve-static';

const dropConsole = false;
const enableProdDevtools = true; // Temporary for internal debugging; set false for production release.
console.log(dropConsole ? 'WARN: Console logs are disabled' : 'INFO: Console logs are enabled');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
  'globalThis.__DEV__': JSON.stringify(process.env.NODE_ENV === 'development'),
  __VUE_PROD_DEVTOOLS__: JSON.stringify(enableProdDevtools),
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  'process.env': JSON.stringify({}),
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue({
      template: {
        compilerOptions: {
          // Treat all unraid-* components as custom elements
          isCustomElement: (tag) => tag.startsWith('unraid-'),
        },
      },
    }),
    ui(),
    serveStaticHtml(), // Serve static test pages
    // Remove console logs in production
    ...(dropConsole
      ? [
          removeConsole({
            includes: ['log', 'info', 'debug'],
          }),
        ]
      : []),
  ],

  css: {
    postcss: {
      plugins: [scopeTailwindToUnapi()],
    },
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      '~/': fileURLToPath(new URL('./src/', import.meta.url)),
    },
  },

  optimizeDeps: {
    include: ['ajv', 'ajv-errors'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },

  define: {
    ...sharedDefine,
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },

  publicDir: false, // Don't copy public files to dist

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: false, // Disable Vite's manifest since we generate our own
    lib: {
      entry: fileURLToPath(new URL('./src/components/Wrapper/auto-mount.ts', import.meta.url)),
      name: 'UnraidStandaloneApps',
      fileName: 'standalone-apps',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'standalone-apps-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'standalone-apps-[hash][extname]';
          }
          return '[name]-[hash][extname]';
        },
        inlineDynamicImports: false,
      },
    },
    cssCodeSplit: false, // Bundle all CSS together
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
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Forwarded-Host', 'localhost:3000');
            proxyReq.setHeader('X-Forwarded-Proto', 'http');
            proxyReq.setHeader('X-Forwarded-For', '127.0.0.1');
          });
          // Handle connection errors gracefully
          proxy.on('error', (err: Error, _req: unknown, res: unknown) => {
            console.warn('[Vite] GraphQL proxy error (API server may not be running):', err.message);
            // Check if res has writeHead method (it's an HTTP response, not a socket)
            const httpRes = res as {
              writeHead?: (statusCode: number, headers: Record<string, string>) => void;
              end?: (data: string) => void;
            };
            if (
              httpRes &&
              typeof httpRes.writeHead === 'function' &&
              typeof httpRes.end === 'function'
            ) {
              httpRes.writeHead(503, {
                'Content-Type': 'application/json',
              });
              httpRes.end(
                JSON.stringify({
                  error: 'GraphQL API server not available',
                  message: 'Please start the API server on port 3001',
                })
              );
            }
          });
        },
      },
      '/webGui': {
        target: `file://${assetsDir}`,
        changeOrigin: true,
      },
    },
    // Configure static file serving
    fs: {
      strict: false,
      allow: ['..'], // Allow serving files outside of root
    },
  },
});
