import { createI18n } from 'vue-i18n';

export default defineNuxtPlugin(({ vueApp }) => {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: 'ja',
    messages: {
      en: {
        hello: 'Hello!'
      },
      ja: {
        hello: 'こんにちは！'
      }
    }
  });

  vueApp.use(i18n);
});
