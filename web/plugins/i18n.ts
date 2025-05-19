import { defineNuxtPlugin } from '#app';
import { createGettextInstance, createTranslateDirective } from '~/composables/i18n';

export default defineNuxtPlugin(({ vueApp }) => {
  // Create the gettext instance - this should be configured with your app's actual translations
  // You might want to modify this to load translations from your API or static files
  const gt = createGettextInstance({
    locale: 'en_US', // This should be dynamic based on user preference or browser
    translations: {}  // Load your translations here
  });
  
  // Register the translation directive
  vueApp.directive('translate', createTranslateDirective(gt));
  
  // Provide the gettext instance to components
  vueApp.provide('gettext', gt);
  
  // Register global properties for convenience
  vueApp.config.globalProperties.$gettext = (text: string) => gt.gettext(text);
  vueApp.config.globalProperties.$ngettext = (singular: string, plural: string, count: number) => 
    gt.ngettext(singular, plural, count);
  vueApp.config.globalProperties.$pgettext = (context: string, text: string) => 
    gt.pgettext(context, text);
  
  return {
    provide: {
      gettext: gt
    }
  };
});
