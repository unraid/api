<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useMutation, useQuery } from '@vue/apollo-composable';

import type { GetThemeQuery } from '~/composables/gql/graphql';

import { SET_THEME_MUTATION } from '~/components/DevThemeSwitcher.mutation';
import { ThemeName } from '~/composables/gql/graphql';
import { DARK_UI_THEMES, GET_THEME_QUERY, useThemeStore } from '~/store/theme';

const themeStore = useThemeStore();

const themeOptions: Array<{ value: ThemeName; label: string }> = [
  { value: ThemeName.WHITE, label: 'White' },
  { value: ThemeName.BLACK, label: 'Black' },
  { value: ThemeName.GRAY, label: 'Gray' },
  { value: ThemeName.AZURE, label: 'Azure' },
];

const STORAGE_KEY_THEME = 'unraid:test:theme';
const THEME_COOKIE_KEY = 'unraid_dev_theme';

const { theme } = storeToRefs(themeStore);

const themeValues = new Set<ThemeName>(themeOptions.map((option) => option.value));

const normalizeTheme = (value?: string | ThemeName | null): ThemeName | null => {
  const normalized = (value ?? '').toString().toLowerCase();
  return themeValues.has(normalized as ThemeName) ? (normalized as ThemeName) : null;
};

const readCookieTheme = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie?.split(';') ?? [];
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split('=');
    if (name?.trim() === THEME_COOKIE_KEY) {
      return decodeURIComponent(rest.join('=').trim());
    }
  }

  return null;
};

const readLocalStorageTheme = (): string | null => {
  try {
    return window.localStorage?.getItem(STORAGE_KEY_THEME) ?? null;
  } catch {
    return null;
  }
};

const readCssTheme = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return getComputedStyle(document.documentElement).getPropertyValue('--theme-name').trim() || null;
};

const resolveInitialTheme = async (): Promise<ThemeName> => {
  const candidates = [readCssTheme(), readCookieTheme(), readLocalStorageTheme(), theme.value?.name];

  for (const candidate of candidates) {
    const normalized = normalizeTheme(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return ThemeName.WHITE;
};

const currentTheme = ref<ThemeName>(normalizeTheme(theme.value.name) ?? ThemeName.WHITE);
const isSaving = ref(false);
const isQueryLoading = ref(false);

const { onResult: onThemeResult, loading: queryLoading } = useQuery<GetThemeQuery>(
  GET_THEME_QUERY,
  null,
  { fetchPolicy: 'network-only' }
);

onThemeResult(({ data }) => {
  const serverTheme = normalizeTheme(data?.publicTheme?.name);
  if (serverTheme) {
    void applyThemeSelection(serverTheme, { skipStore: false });
  }
});

watch(
  () => queryLoading.value,
  (loading) => {
    isQueryLoading.value = loading;
  },
  { immediate: true }
);

const { mutate: setThemeMutation } = useMutation(SET_THEME_MUTATION);

const persistThemePreference = (themeName: ThemeName) => {
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${THEME_COOKIE_KEY}=${encodeURIComponent(themeName)}; path=/; SameSite=Lax; expires=${expires}`;
  try {
    window.localStorage?.setItem(STORAGE_KEY_THEME, themeName);
  } catch {
    // ignore
  }
};

const syncDomForTheme = (themeName: ThemeName) => {
  const root = document.documentElement;
  const isDark = DARK_UI_THEMES.includes(themeName as (typeof DARK_UI_THEMES)[number]);
  const method: 'add' | 'remove' = isDark ? 'add' : 'remove';

  root.style.setProperty('--theme-name', themeName);
  root.style.setProperty('--theme-dark-mode', isDark ? '1' : '0');
  root.setAttribute('data-theme', themeName);
  root.classList[method]('dark');
  document.body?.classList[method]('dark');
  document.querySelectorAll('.unapi').forEach((el) => el.classList[method]('dark'));
};

const updateThemeCssLink = (themeName: ThemeName) => {
  const linkId = 'dev-theme-css-link';
  let themeLink = document.getElementById(linkId) as HTMLLinkElement | null;

  const themeCssMap: Record<ThemeName, string> = {
    [ThemeName.AZURE]: '/test-pages/unraid-assets/themes/azure.css',
    [ThemeName.BLACK]: '/test-pages/unraid-assets/themes/black.css',
    [ThemeName.GRAY]: '/test-pages/unraid-assets/themes/gray.css',
    [ThemeName.WHITE]: '/test-pages/unraid-assets/themes/white.css',
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
  } else if (themeLink) {
    themeLink.remove();
  }
};

const applyThemeSelection = async (
  themeName: string | null | undefined,
  { persist = false, skipStore = false }: { persist?: boolean; skipStore?: boolean } = {}
) => {
  const normalized = normalizeTheme(themeName) ?? ThemeName.WHITE;
  currentTheme.value = normalized;

  persistThemePreference(normalized);
  syncDomForTheme(normalized);
  updateThemeCssLink(normalized);

  if (!skipStore) {
    themeStore.setTheme({ name: normalized });
  }

  if (persist) {
    isSaving.value = true;
    try {
      await setThemeMutation({ theme: normalized });
    } catch (error) {
      console.warn('[DevThemeSwitcher] Failed to persist theme via GraphQL', error);
    } finally {
      isSaving.value = false;
    }
  }
};

const handleThemeChange = (event: Event) => {
  const newTheme = normalizeTheme((event.target as HTMLSelectElement).value);
  if (!newTheme || newTheme === currentTheme.value) {
    return;
  }

  void applyThemeSelection(newTheme, { persist: true });
};

onMounted(async () => {
  themeStore.setDevOverride(true);

  const initialTheme = await resolveInitialTheme();
  await applyThemeSelection(initialTheme);
});

watch(
  () => theme.value.name,
  (newName) => {
    const normalized = normalizeTheme(newName);
    if (!normalized || normalized === currentTheme.value) {
      return;
    }

    void applyThemeSelection(normalized, { skipStore: true });
  }
);
</script>

<template>
  <select
    :value="currentTheme"
    class="dev-theme-select"
    :disabled="isSaving || isQueryLoading"
    @change="handleThemeChange"
  >
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

.dev-theme-select:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
