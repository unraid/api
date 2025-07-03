<script lang="ts" setup>
import en_US from '~/locales/en_US.json';
import { provide } from 'vue';
import { createI18n, I18nInjectionKey } from 'vue-i18n';
import { createHtmlEntityDecoder } from '~/helpers/i18n-utils';

// import ja from '~/locales/ja.json';

const defaultLocale = 'en_US'; // ja, en_US
let parsedLocale = '';
let parsedMessages = {};
let nonDefaultLocale = false;
/**
 * In myservers2.php, we have a script tag that sets window.LOCALE_DATA to a stringified JSON object.
 * Unfortunately, this was the only way I could get the data from PHP to vue-i18n :(
 * I tried using i18n.setLocaleMessage() but it didn't work no matter what I tried.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const windowLocaleData = (window as any).LOCALE_DATA || null;
if (windowLocaleData) {
  try {
    parsedMessages = JSON.parse(decodeURIComponent(windowLocaleData));
    parsedLocale = Object.keys(parsedMessages)[0];
    nonDefaultLocale = parsedLocale !== defaultLocale;
  } catch (error) {
    console.error('[I18nHost] error parsing messages', error);
  }
}

const i18n = createI18n<false>({
  legacy: false, // must set to `false`
  locale: nonDefaultLocale ? parsedLocale : defaultLocale,
  fallbackLocale: defaultLocale,
  messages: {
    en_US,
    // ja,
    ...(nonDefaultLocale ? parsedMessages : {}),
  },
  /** safely decodes html-encoded symbols like &amp; and &apos; */
  postTranslation: createHtmlEntityDecoder(),
});

provide(I18nInjectionKey, i18n);
</script>

<template>
  <div>
    <slot />
  </div>
</template>

<style>
/* unraid-i18n-host {
  font-size: 16px;
} */
</style>
