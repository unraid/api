<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const localeOptions = [
  { value: 'en_US', label: 'English (US)' },
  { value: 'ar', label: 'العربية (Arabic)' },
  { value: 'bn', label: 'বাংলা (Bengali)' },
  { value: 'ca', label: 'Català (Catalan)' },
  { value: 'cs', label: 'Čeština (Czech)' },
  { value: 'da', label: 'Dansk (Danish)' },
  { value: 'de', label: 'Deutsch (German)' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'fr', label: 'Français (French)' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'hr', label: 'Hrvatski (Croatian)' },
  { value: 'hu', label: 'Magyar (Hungarian)' },
  { value: 'it', label: 'Italiano (Italian)' },
  { value: 'ja', label: '日本語 (Japanese)' },
  { value: 'ko', label: '한국어 (Korean)' },
  { value: 'lv', label: 'Latviešu (Latvian)' },
  { value: 'nl', label: 'Nederlands (Dutch)' },
  { value: 'no', label: 'Norsk (Norwegian)' },
  { value: 'pl', label: 'Polski (Polish)' },
  { value: 'pt', label: 'Português (Portuguese)' },
  { value: 'ro', label: 'Română (Romanian)' },
  { value: 'ru', label: 'Русский (Russian)' },
  { value: 'sv', label: 'Svenska (Swedish)' },
  { value: 'uk', label: 'Українська (Ukrainian)' },
  { value: 'zh', label: '中文 (Chinese)' },
];

const currentLocale = ref(locale.value);

const handleLocaleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const newLocale = target.value;

  try {
    // Update window.LOCALE for persistence
    window.LOCALE = newLocale;

    // Force a page reload to ensure all components pick up the new locale
    // This is necessary for components that are already mounted and for the mount engine
    window.location.reload();
  } catch (error) {
    console.error('Failed to change locale:', error);
  }
};

// Watch for external locale changes
watch(locale, (newLocale) => {
  currentLocale.value = newLocale;
});

// Initialize current locale on mount
onMounted(() => {
  currentLocale.value = locale.value;
});
</script>

<template>
  <div class="flex flex-col gap-2 border-2 border-r-2 border-solid p-2">
    <h2 class="text-lg font-medium">Language Selection</h2>
    <div class="flex flex-col gap-2">
      <label for="locale-select" class="text-sm font-medium text-gray-700">
        Current Language: {{ currentLocale }}
      </label>
      <select
        id="locale-select"
        v-model="currentLocale"
        @change="handleLocaleChange"
        class="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <option v-for="option in localeOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    <div class="text-xs text-gray-500">
      <p>Note: Page will reload after language change to ensure all components update.</p>
    </div>
  </div>
</template>
