<script lang="ts" setup>
import { provide } from 'vue';
import { createI18n, I18nInjectionKey } from 'vue-i18n';

import en_US from '~/locales/en_US.json'; // eslint-disable-line camelcase
// import ja from '~/locales/ja.json';

const defaultLocale = 'en_US'; // ja, en_US
const i18n = createI18n<false>({
  legacy: false, // must set to `false`
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  messages: {
    en_US, // eslint-disable-line camelcase
    // ja,
  }
});

provide(I18nInjectionKey, i18n);

export interface Props {
  locale?: string;
  messages?: string;
}
const props = withDefaults(defineProps<Props>(), {
  locale: defaultLocale,
  messages: '',
});

onBeforeMount(() => {
  if (props.messages) {
    try {
      const parsedMessages = JSON.parse(decodeURIComponent(props.messages));
      i18n.global.locale.value = Object.keys(parsedMessages)[0];
      i18n.global.setLocaleMessage(Object.keys(parsedMessages)[0], parsedMessages);
      console.debug('[i18nHost] Messages parsed and set', Object.keys(parsedMessages)[0], parsedMessages);
    } catch (error) {
      console.error('[i18nHost] Failed to parse messages', error);
    }
  }
});
</script>

<template>
  <slot />
</template>
