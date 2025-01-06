import { createI18n } from 'vue-i18n';

import en_US from '@/locales/en_US.json'; 
const parser = new DOMParser();

export default defineNuxtPlugin(({ vueApp }) => {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: 'en_US',
    fallbackLocale: 'en_US',
    messages: {
      en_US,  
    },
    postTranslation(translated) {
      if (typeof translated !== 'string') return translated;
      // parseFromString interprets the string as HTML, then textContent reads the decoded text
      const decoded = parser.parseFromString(translated, 'text/html').documentElement.textContent;
      return decoded ?? translated; // fallback if somehow it's null
    }
  });

  vueApp.use(i18n);
});
