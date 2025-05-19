<script lang="ts" setup>
import en_US from '~/locales/en_US.json';
import { provide } from 'vue';
import { createGettextInstance } from '~/composables/i18n';

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

// Create a Gettext instance with default translations
const gt = createGettextInstance({
  translations: en_US,
  locale: defaultLocale,
  sourceLocale: defaultLocale
});

try {
  // Add non-default locale translations if available
  if (nonDefaultLocale && parsedMessages) {
    const localeMessages = parsedMessages[parsedLocale as keyof typeof parsedMessages] || {};
    
    // Create a translations object in the format expected by node-gettext
    const gettextTranslations = {
      translations: {
        '': {} as { [msgid: string]: { msgid: string; msgstr: string[] } }
      }
    };
    
    Object.entries(localeMessages).forEach(([key, value]) => {
      gettextTranslations.translations[''][key] = {
        msgid: key,
        msgstr: [value as string]
      };
    });
    
    gt.addTranslations(parsedLocale, 'messages', gettextTranslations);
    gt.setLocale(parsedLocale);
  }
} catch (error) {
  console.error('[I18nHost] Failed to initialize translations:', error);
}

// Make gettext available to child components
provide('gettext', gt);
</script>

<template>
  <slot />
</template>

<style>
/* unraid-i18n-host {
  font-size: 16px;
} */
</style>
