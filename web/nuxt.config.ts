import removeConsole from 'vite-plugin-remove-console';

/**
 * Used to avoid redeclaring variables in the webgui codebase.
 * @see alt solution https://github.com/terser/terser/issues/1001, https://github.com/terser/terser/pull/1038
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

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  devServer: {
    port: 4321,
  },

  devtools: {
    enabled: process.env.NODE_ENV === 'development',
  },

  modules: ['@vueuse/nuxt', '@pinia/nuxt', '@nuxtjs/tailwindcss', 'nuxt-custom-elements', '@nuxt/eslint'],

  ignore: ['/webGui/images'],

  components: [
    { path: '~/components/Brand', prefix: 'Brand' },
    { path: '~/components/ConnectSettings', prefix: 'ConnectSettings' },
    { path: '~/components/UserProfile', prefix: 'Upc' },
    { path: '~/components/UpdateOs', prefix: 'UpdateOs' },
    '~/components',
  ],

  vite: {
    build: {
      // Increase chunk size warning limit to reduce noise
      chunkSizeWarningLimit: 1000,
      // Enable parallel build with thread pooling
      minify: 'terser',
      terserOptions: {
        mangle: {
          reserved: terserReservations(charsToReserve),
          toplevel: true,
        },
        compress: {
          // Optimize terser compression
          drop_console: !process.env.VITE_ALLOW_CONSOLE_LOGS,
          drop_debugger: true,
          pure_funcs: !process.env.VITE_ALLOW_CONSOLE_LOGS ? ['console.log', 'console.info', 'console.debug'] : [],
          passes: 2, // Reduce passes for faster build
        }
      },
      // Implement code splitting and manual chunking
      rollupOptions: {
        output: {
          // Simpler chunking strategy for better performance
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('vue') || id.includes('pinia')) {
                return 'vendor';
              }
              return 'deps';
            }
          }
        }
      },
      // Enable parallel processing
      reportCompressedSize: false,
      cssMinify: true,
    },
    // Enable build caching
    optimizeDeps: {
      include: [
        'vue',
        'pinia',
        '@vueuse/core',
      ],
      // Disable dependency discovery for faster builds
      noDiscovery: process.env.NODE_ENV === 'production',
    },
    plugins: [
      // Only remove non-critical console methods when VITE_ALLOW_CONSOLE_LOGS is false
      // Keeps console.warn and console.error for debugging purposes
      !process.env.VITE_ALLOW_CONSOLE_LOGS &&
        removeConsole({
          includes: ['log', 'info', 'debug'],
        }),
    ],
    define: {
      'globalThis.__DEV__': process.env.NODE_ENV === 'development',
      __VUE_PROD_DEVTOOLS__: false,
    },
  },
  customElements: {
    // Optimize custom elements build
    buildOptions: {
      vite: {
        build: {
          minify: 'terser',
          terserOptions: {
            mangle: {
              reserved: terserReservations(charsToReserve),
              toplevel: true,
            },
            compress: {
              drop_console: !process.env.VITE_ALLOW_CONSOLE_LOGS,
              drop_debugger: true,
              passes: 2, // Reduce passes for faster build
            }
          },
          reportCompressedSize: false,
          cssMinify: true,
          // Simpler chunking for custom elements
          rollupOptions: {
            output: {
              manualChunks(id: string) {
                if (id.includes('node_modules')) {
                  return 'vendor';
                }
              }
            }
          }
        },
        // Skip HMR for production builds
        server: {
          hmr: false
        }
      }
    },
    entries: [
      {
        name: 'UnraidComponents',
        tags: [
          {
            name: 'UnraidI18nHost',
            path: '@/components/I18nHost.ce',
          },
          {
            name: 'UnraidAuth',
            path: '@/components/Auth.ce',
          },
          {
            name: 'UnraidConnectSettings',
            path: '@/components/ConnectSettings/ConnectSettings.ce',
          },
          {
            name: 'UnraidDownloadApiLogs',
            path: '@/components/DownloadApiLogs.ce',
          },
          {
            name: 'UnraidHeaderOsVersion',
            path: '@/components/HeaderOsVersion.ce',
          },
          {
            name: 'UnraidModals',
            path: '@/components/Modals.ce',
          },
          {
            name: 'UnraidUserProfile',
            path: '@/components/UserProfile.ce',
          },
          {
            name: 'UnraidUpdateOs',
            path: '@/components/UpdateOs.ce',
          },
          {
            name: 'UnraidDowngradeOs',
            path: '@/components/DowngradeOs.ce',
          },
          {
            name: 'UnraidRegistration',
            path: '@/components/Registration.ce',
          },
          {
            name: 'UnraidWanIpCheck',
            path: '@/components/WanIpCheck.ce',
          },
          {
            name: 'UnraidWelcomeModal',
            path: '@/components/WelcomeModal.ce',
          },
          {
            name: 'UnraidSsoButton',
            path: '@/components/SsoButton.ce',
          },
          {
            name: 'UnraidLogViewer',
            path: '@/components/Logs/LogViewer.ce',
          },
        ],
      },
    ],
  },

  // Enable build caching
  experimental: {
    payloadExtraction: true,
    treeshakeClientOnly: true,
    asyncContext: true,
    asyncEntry: true,
    // Improve HMR performance
  },

  compatibilityDate: '2024-12-05',
});