<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useThemeStore } from '~/store/theme';

const themeStore = useThemeStore();

const themeOptions = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'gray', label: 'Gray' },
  { value: 'azure', label: 'Azure' },
] as const;

const STORAGE_KEY_THEME = 'unraid:test:theme';

const { theme } = storeToRefs(themeStore);

const currentTheme = ref<string>(theme.value.name);

const getCurrentTheme = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const urlTheme = urlParams.get('theme');

  if (urlTheme && themeOptions.some((t) => t.value === urlTheme)) {
    return urlTheme;
  }

  if (theme.value?.name) {
    return theme.value.name;
  }

  try {
    return window.localStorage?.getItem(STORAGE_KEY_THEME) || 'white';
  } catch {
    return 'white';
  }
};

const updateTheme = (themeName: string, skipUrlUpdate = false) => {
  if (!skipUrlUpdate) {
    const url = new URL(window.location.href);
    url.searchParams.set('theme', themeName);
    window.history.replaceState({}, '', url);
  }

  try {
    window.localStorage?.setItem(STORAGE_KEY_THEME, themeName);
  } catch {
    // ignore
  }

  themeStore.setTheme({ name: themeName });
  themeStore.setCssVars();

  const linkId = 'dev-theme-css-link';
  let themeLink = document.getElementById(linkId) as HTMLLinkElement | null;

  const themeCssMap: Record<string, string> = {
    azure: '/test-pages/unraid-assets/themes/azure.css',
    black: '/test-pages/unraid-assets/themes/black.css',
    gray: '/test-pages/unraid-assets/themes/gray.css',
    white: '/test-pages/unraid-assets/themes/white.css',
  };

  const cssUrl = themeCssMap[themeName];

  if (cssUrl) {
    if (!themeLink) {
      themeLink = document.createElement('link');
      themeLink.id = linkId;
      themeLink.rel = 'stylesheet';
      document.head.appendChild(themeLink);
    }
    themeLink.href = cssUrl;
  } else {
    if (themeLink) {
      themeLink.remove();
    }
  }
};

const handleThemeChange = (event: Event) => {
  const newTheme = (event.target as HTMLSelectElement).value;
  if (newTheme === currentTheme.value) {
    return;
  }
  currentTheme.value = newTheme;
  updateTheme(newTheme);
};

onMounted(() => {
  themeStore.setDevOverride(true);

  const initialTheme = getCurrentTheme();
  currentTheme.value = initialTheme;

  const existingLink = document.getElementById('dev-theme-css-link') as HTMLLinkElement | null;
  if (!existingLink || !existingLink.href) {
    updateTheme(initialTheme, true);
  } else {
    themeStore.setTheme({ name: initialTheme });
    themeStore.setCssVars();
  }
});

watch(
  () => theme.value.name,
  (newName) => {
    if (newName && newName !== currentTheme.value) {
      currentTheme.value = newName;
      const url = new URL(window.location.href);
      url.searchParams.set('theme', newName);
      window.history.replaceState({}, '', url);
    }
  }
);
</script>

<template>
  <select :value="currentTheme" class="dev-theme-select" @change="handleThemeChange">
    <option v-for="option in themeOptions" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>

<style scoped>
.dev-theme-select {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.9);
  color: #f9fafb;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
}

.dev-theme-select:hover {
  border-color: rgba(148, 163, 184, 0.6);
}

.dev-theme-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
</style>
