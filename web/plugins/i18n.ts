import { createI18n } from 'vue-i18n';
import { defineNuxtPlugin } from '#imports';

import en_US from '@/locales/en_US.json'; 
import { createHtmlEntityDecoder } from '~/helpers/i18n-utils';

export default defineNuxtPlugin(({ vueApp }) => {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: 'en_US',
    fallbackLocale: 'en_US',
    messages: {
      en_US,  
    },
    postTranslation: createHtmlEntityDecoder(),
  });

  vueApp.use(i18n);
});
