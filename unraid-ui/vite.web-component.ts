import { fileURLToPath, URL } from 'node:url';
// import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import tailwindcss from 'tailwindcss';


// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  build: {
    cssCodeSplit: false,
    // manifest: true,
    lib: {
      entry: fileURLToPath(new URL('./src/register.ts', import.meta.url)),
      name: 'unraid-web-components',
      formats: ['es'],
    },
    rollupOptions: {
      //   external: ['vue'],
      //   output: {
      //     inlineDynamicImports: true,
      //   },
    },
  },
});
