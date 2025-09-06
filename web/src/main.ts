import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import { DefaultApolloClient } from '@vue/apollo-composable';
import ui from '@nuxt/ui/vue-plugin';

// Import main CSS
import '~/assets/main.css';

import App from '@/App.vue';
// Import router and main app
import router from '@/router';
import { client } from '~/helpers/create-apollo-client';
import { createHtmlEntityDecoder } from '~/helpers/i18n-utils';
import en_US from '~/locales/en_US.json';

import { globalPinia } from '~/store/globalPinia';

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
app.use(ui);

// Provide Apollo client
app.provide(DefaultApolloClient, client);

app.mount('#app');
