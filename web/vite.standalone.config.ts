import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path, { resolve } from 'path';
import fs from 'fs';

// Read CSS content at build time
const getCssContent = () => {
  const directories = [
    '.nuxt/dist/client/_nuxt',
    '.output/public/_nuxt'
  ];
  
  for (const dir of directories) {
    const fullDir = path.resolve(__dirname, dir);
    if (fs.existsSync(fullDir)) {
      // Find entry.*.css files dynamically
      const files = fs.readdirSync(fullDir);
      const entryFile = files.find(f => f.startsWith('entry.') && f.endsWith('.css'));
      
      if (entryFile) {
        const fullPath = path.join(fullDir, entryFile);
        console.log(`Reading CSS from: ${fullPath}`);
        return fs.readFileSync(fullPath, 'utf-8');
      }
    }
  }
  
  // Fallback to source asset
  const fallback = path.resolve(__dirname, 'assets/main.css');
  if (fs.existsSync(fallback)) {
    console.warn('Nuxt CSS not found; falling back to assets/main.css');
    return fs.readFileSync(fallback, 'utf-8');
  }
  
  console.warn('No CSS file found, using empty string');
  return '';
};

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'inject-css-content',
      transform(code, id) {
        // Replace CSS import with actual content
        if (id.includes('vue-mount-app')) {
          const cssContent = getCssContent();
          const replacement = `const tailwindStyles = ${JSON.stringify(cssContent)};`;
          
          // Replace the import statement
          code = code.replace(
            /import tailwindStyles from ['"]~\/assets\/main\.css\?inline['"];?/,
            replacement
          );
          
          return code;
        }
        return null;
      },
    },
  ],
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './'),
    },
  },
  build: {
    outDir: '.nuxt/standalone-apps',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'components/standalone-mount.ts'),
      name: 'UnraidStandaloneApps',
      fileName: 'standalone-apps',
      formats: ['es'],
    },
    rollupOptions: {
      external: [],
      output: {
        format: 'es',
        entryFileNames: 'standalone-apps.js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]',
        inlineDynamicImports: false,
      },
    },
    cssCodeSplit: false,
    minify: 'terser',
    terserOptions: {
      mangle: {
        toplevel: true,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
});
