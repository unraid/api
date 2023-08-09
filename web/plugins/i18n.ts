import { createI18n } from 'vue-i18n';

import en_US from '@/locales/en_US.json';

export default defineNuxtPlugin(({ vueApp }) => {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: 'en_US',
    fallbackLocale: 'en_US',
    messages: {
      en_US,
    },
  });

  vueApp.use(i18n);
});
