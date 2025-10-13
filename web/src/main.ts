import { createApp } from 'vue';
import { DefaultApolloClient } from '@vue/apollo-composable';
import ui from '@nuxt/ui/vue-plugin';

// Import main CSS
import '~/assets/main.css';

import App from '@/App.vue';
// Import router and main app
import router from '@/router';
import { client } from '~/helpers/create-apollo-client';
import { createI18nInstance, ensureLocale, getWindowLocale } from '~/helpers/i18n-loader';

import { globalPinia } from '~/store/globalPinia';

const bootstrap = async () => {
  const app = createApp(App);
  const i18n = createI18nInstance();

  app.use(i18n);
  app.use(globalPinia);
  app.use(router);
  app.use(ui);

  // Provide Apollo client
  app.provide(DefaultApolloClient, client);

  await ensureLocale(i18n, getWindowLocale());

  app.mount('#app');
};

void bootstrap();
