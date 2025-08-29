import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import { DefaultApolloClient } from '@vue/apollo-composable';

// Import main CSS
import '~/assets/main.css';

// Import router and main app
import router from '@/src/router';
import App from '@/src/App.vue';

// Import UI configurations
import * as uiConfig from '@/src/ui-config';

import en_US from '~/locales/en_US.json';
import { createHtmlEntityDecoder } from '~/helpers/i18n-utils';
import { globalPinia } from '~/store/globalPinia';
import { client } from '~/helpers/create-apollo-client';

const app = createApp(App);

// Create and configure i18n
const defaultLocale = 'en_US';
let parsedLocale = '';
let parsedMessages = {};
let nonDefaultLocale = false;

// Check for window locale data
if (typeof window !== 'undefined') {
  const windowLocaleData = (window as unknown as { LOCALE_DATA?: string }).LOCALE_DATA || null;
  if (windowLocaleData) {
    try {
      parsedMessages = JSON.parse(decodeURIComponent(windowLocaleData));
      parsedLocale = Object.keys(parsedMessages)[0] || '';
      nonDefaultLocale = parsedLocale !== defaultLocale;
    } catch (error) {
      console.error('[Main] error parsing messages', error);
    }
  }
}

const i18n = createI18n({
  legacy: false,
  locale: nonDefaultLocale ? parsedLocale : defaultLocale,
  fallbackLocale: defaultLocale,
  messages: {
    en_US,
    ...(nonDefaultLocale ? parsedMessages : {}),
  },
  postTranslation: createHtmlEntityDecoder(),
});

app.use(i18n);
app.use(globalPinia);
app.use(router);

// Provide Apollo client
app.provide(DefaultApolloClient, client);

// Provide UI config
app.provide('ui.config', uiConfig);

app.mount('#app');