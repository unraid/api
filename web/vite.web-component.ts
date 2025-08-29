import { fileURLToPath, URL } from 'node:url';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import removeConsole from 'vite-plugin-remove-console';

const dropConsole = process.env.VITE_ALLOW_CONSOLE_LOGS !== 'true';

/**
 * Used to avoid redeclaring variables in the webgui codebase.
 */
function terserReservations(inputStr: string) {
  const combinations = ['ace'];

  for (let i = 0; i < inputStr.length; i++) {
    combinations.push(inputStr[i]);
  }

  for (let i = 0; i < inputStr.length; i++) {
    for (let j = 0; j < inputStr.length; j++) {
      combinations.push(inputStr[i] + inputStr[j]);
    }
  }

  return combinations;
}

const charsToReserve = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * jQuery isolation plugin for custom elements
 */
const jqueryIsolationPlugin = {
  name: 'jquery-isolation',
  generateBundle(options: any, bundle: any) {
    const jsFile = Object.keys(bundle).find((key) => key.endsWith('.js'));
    if (jsFile && bundle[jsFile] && 'code' in bundle[jsFile]) {
      const originalCode = bundle[jsFile].code;
      bundle[jsFile].code = `
(function() {
  // Preserve the original jQuery $ if it exists
  var originalJQuery = (typeof window !== 'undefined' && typeof window.$ !== 'undefined') ? window.$ : undefined;
  
  // Temporarily clear $ to avoid conflicts
  if (typeof window !== 'undefined' && typeof window.$ !== 'undefined') {
    window.$ = undefined;
  }
  
  // Execute the web component code
  ${originalCode}
  
  // Restore jQuery $ if it was originally defined
  if (originalJQuery !== undefined && typeof window !== 'undefined') {
    window.$ = originalJQuery;
  }
})();
`;
    }
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    ...(dropConsole ? [
      removeConsole({
        includes: ['log', 'info', 'debug'],
      })
    ] : []),
    jqueryIsolationPlugin,
  ],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      '~/': fileURLToPath(new URL('./', import.meta.url)),
    },
  },

  define: {
    'globalThis.__DEV__': process.env.NODE_ENV === 'development',
    __VUE_PROD_DEVTOOLS__: false,
    'process.env.NODE_ENV': JSON.stringify('production'),
  },

  build: {
    outDir: 'dist-wc',
    manifest: 'webcomponent.manifest.json',
    sourcemap: true,
    cssCodeSplit: false,
    minify: 'terser',
    terserOptions: {
      mangle: {
        reserved: terserReservations(charsToReserve),
        toplevel: true,
      },
    },
    lib: {
      entry: fileURLToPath(new URL('./src/register.ts', import.meta.url)),
      name: 'unraid-web-components',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash][extname]',
      },
    },
  },
});
