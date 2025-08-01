import { createI18n } from 'vue-i18n';
import type { App } from 'vue';
import { DefaultApolloClient } from '@vue/apollo-composable';

// Import Tailwind CSS for web components shadow DOM injection
import tailwindStyles from '~/assets/main.css?inline';

// Import UI configurations from .nuxt generated files
import * as uiConfig from '~/.nuxt/ui';

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
        parsedLocale = Object.keys(parsedMessages)[0] || '';
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

  // Provide UI config for components
  Vue.provide('ui.config', uiConfig);


  // Inject Tailwind CSS into the shadow DOM
  Vue.mixin({
    mounted() {
      if (typeof window !== 'undefined' && this.$el) {
        const shadowRoot = this.$el.getRootNode();
        if (shadowRoot && shadowRoot !== document && !shadowRoot.querySelector('style[data-tailwind]')) {
          const styleElement = document.createElement('style');
          styleElement.setAttribute('data-tailwind', 'true');
          styleElement.textContent = tailwindStyles;
          // Append instead of prepend to ensure styles come after any component styles
          shadowRoot.appendChild(styleElement);
        }
      }
    }
  });
}
