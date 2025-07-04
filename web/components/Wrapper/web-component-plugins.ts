import { createI18n } from 'vue-i18n';
import type { App } from 'vue';
import { DefaultApolloClient } from '@vue/apollo-composable';

import en_US from '~/locales/en_US.json';
import { createHtmlEntityDecoder } from '~/helpers/i18n-utils';
import { globalPinia } from '~/store/globalPinia';
import { client } from '~/helpers/create-apollo-client';

export default function (Vue: App) {
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
        parsedLocale = Object.keys(parsedMessages)[0];
        nonDefaultLocale = parsedLocale !== defaultLocale;
      } catch (error) {
        console.error('[WebComponentPlugins] error parsing messages', error);
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

  Vue.use(i18n);

  // Use the shared Pinia instance
  Vue.use(globalPinia);

  // Provide Apollo client for all web components
  Vue.provide(DefaultApolloClient, client);

  console.log('Vue App', Vue);
} 