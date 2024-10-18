import { readFileSync } from 'fs';
import { parse } from 'dotenv';
import removeConsole from "vite-plugin-remove-console";


const envConfig = parse(readFileSync('.env'));
console.log('\n');
console.log('==============================');
console.log('========= ENV VALUES =========');
console.log('==============================');
for (const k in envConfig) {
  process.env[k] = envConfig[k];
  console.log(`[${k}]`, process.env[k]);
}
console.log('==============================');
console.log('\n');

/**
 * Used to avoid redeclaring variables in the webgui codebase.
 * @see alt solution https://github.com/terser/terser/issues/1001, https://github.com/terser/terser/pull/1038
 */
function terserReservations (inputStr: string) {
  const combinations = ['ace', 'i'];

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
    enabled: true,
  },
  modules: [
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    'nuxt-custom-elements',
    "@nuxt/eslint",
    'shadcn-nuxt',
  ],
  components: [
    { path: "~/components/Brand", prefix: "Brand" },
    { path: "~/components/ConnectSettings", prefix: "ConnectSettings" },
    { path: "~/components/Ui", prefix: "Ui" },
    { path: "~/components/UserProfile", prefix: "Upc" },
    { path: "~/components/UpdateOs", prefix: "UpdateOs" },
    "~/components",
  ],
  // typescript: {
  //   typeCheck: true
  // },
  shadcn: {
    prefix: '',
    componentDir: './components/shadcn'
  },
  vite: {
    plugins: [
      !process.env.VITE_ALLOW_CONSOLE_LOGS && removeConsole({
        includes: ["log", "warn", "error", "info", "debug"],
      }),
    ],
    build: {
      minify: "terser",
      terserOptions: {
        mangle: process.env.VITE_ALLOW_CONSOLE_LOGS
          ? false
          : {
              reserved: terserReservations(charsToReserve),
              toplevel: true,
            },
      },
    },
  },
  customElements: {
    entries: [
      {
        name: "UnraidComponents",
        tags: [
          {
            name: "UnraidI18nHost",
            path: "@/components/I18nHost.ce",
          },
          {
            name: "UnraidAuth",
            path: "@/components/Auth.ce",
          },
          {
            name: "UnraidConnectSettings",
            path: "@/components/ConnectSettings/ConnectSettings.ce",
          },
          {
            name: "UnraidDownloadApiLogs",
            path: "@/components/DownloadApiLogs.ce",
          },
          {
            name: "UnraidHeaderOsVersion",
            path: "@/components/HeaderOsVersion.ce",
          },
          {
            name: "UnraidModals",
            path: "@/components/Modals.ce",
          },
          {
            name: "UnraidUserProfile",
            path: "@/components/UserProfile.ce",
          },
          {
            name: "UnraidUpdateOs",
            path: "@/components/UpdateOs.ce",
          },
          {
            name: "UnraidDowngradeOs",
            path: "@/components/DowngradeOs.ce",
          },
          {
            name: "UnraidRegistration",
            path: "@/components/Registration.ce",
          },
          {
            name: "UnraidWanIpCheck",
            path: "@/components/WanIpCheck.ce",
          },
        ],
      },
    ],
  },
});