<script lang="ts" setup>
import { provide } from 'vue';
import { createI18n, I18nInjectionKey } from 'vue-i18n';

import en_US from '~/locales/en_US.json'; // eslint-disable-line camelcase
import ja from '~/locales/ja.json';

const defaultLocale = 'ja'; // ja, en_US
const i18n = createI18n<false>({
  legacy: false, // must set to `false`
  locale: defaultLocale,
  messages: {
    en_US, // eslint-disable-line camelcase
    ja,
  }
});

provide(I18nInjectionKey, i18n);

export interface Props {
  locale?: string;
}
const props = withDefaults(defineProps<Props>(), {
  locale: defaultLocale,
});

watchEffect(() => {
  i18n.global.locale.value = props.locale;
});
</script>

<template>
  <slot />
</template>
