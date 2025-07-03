import { createI18n } from 'vue-i18n';
import { createPinia } from 'pinia';
import type { App } from 'vue';

import en_US from '~/locales/en_US.json';
import { createHtmlEntityDecoder } from '~/helpers/i18n-utils';

export default function (Vue: App) {
  // Create and configure i18n
  const defaultLocale = 'en_US';
  let parsedLocale = '';
  let parsedMessages = {};
  let nonDefaultLocale = false;

  // Check for window locale data (same logic as I18nHost)
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

  // Create and configure Pinia
  const pinia = createPinia();
  Vue.use(pinia);

  console.log('Vue App', Vue);
} 