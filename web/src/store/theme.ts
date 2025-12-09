import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useLazyQuery } from '@vue/apollo-composable';

import { isDarkModeActive } from '@unraid/ui';
import { defaultColors } from '~/themes/default';

import type { GetThemeQuery } from '~/composables/gql/graphql';
import type { Theme, ThemeVariables } from '~/themes/types';

import { graphql } from '~/composables/gql/gql';

// Themes that should apply the .dark class (dark UI themes)
export const DARK_UI_THEMES = ['gray', 'black'] as const;

export const GET_THEME_QUERY = graphql(`
  query getTheme {
    publicTheme {
      name
      showBannerImage
      showBannerGradient
      headerBackgroundColor
      showHeaderDescription
      headerPrimaryTextColor
      headerSecondaryTextColor
    }
  }
`);

const DEFAULT_THEME: Theme = {
  name: 'white',
  banner: false,
  bannerGradient: false,
  bgColor: '',
  descriptionShow: false,
  metaColor: '',
  textColor: '',
};

type ThemeSource = 'local' | 'server';

const isDomAvailable = () => typeof document !== 'undefined';

const getCssVar = (name: string): string => {
  if (!isDomAvailable()) return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

const readDomThemeName = () => getCssVar('--theme-name');

const syncDarkClass = (method: 'add' | 'remove') => {
  if (!isDomAvailable()) return;
  document.documentElement.classList[method]('dark');
  document.body?.classList[method]('dark');
  document.querySelectorAll('.unapi').forEach((el) => el.classList[method]('dark'));
};

const applyDarkClass = (isDark: boolean) => {
  if (!isDomAvailable()) return;
  const method: 'add' | 'remove' = isDark ? 'add' : 'remove';
  syncDarkClass(method);
  document.documentElement.style.setProperty('--theme-dark-mode', isDark ? '1' : '0');
};

const bootstrapDarkClass = () => {
  if (isDarkModeActive()) {
    applyDarkClass(true);
  }
};

const sanitizeTheme = (data: Partial<Theme> | null | undefined): Theme | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  return {
    name: typeof data.name === 'string' ? data.name : DEFAULT_THEME.name,
    banner: typeof data.banner === 'boolean' ? data.banner : DEFAULT_THEME.banner,
    bannerGradient:
      typeof data.bannerGradient === 'boolean' ? data.bannerGradient : DEFAULT_THEME.bannerGradient,
    bgColor: typeof data.bgColor === 'string' ? data.bgColor : DEFAULT_THEME.bgColor,
    descriptionShow:
      typeof data.descriptionShow === 'boolean' ? data.descriptionShow : DEFAULT_THEME.descriptionShow,
    metaColor: typeof data.metaColor === 'string' ? data.metaColor : DEFAULT_THEME.metaColor,
    textColor: typeof data.textColor === 'string' ? data.textColor : DEFAULT_THEME.textColor,
  };
};

export const useThemeStore = defineStore('theme', () => {
  // State
  const theme = ref<Theme>({ ...DEFAULT_THEME });

  const activeColorVariables = ref<ThemeVariables>(defaultColors.white);
  const hasServerTheme = ref(false);
  const devOverride = ref(false);

  // Initialize dark mode from CSS variable set by PHP or any pre-applied .dark class
  bootstrapDarkClass();

  // Lazy query - only executes when explicitly called
  const { load, onResult, onError } = useLazyQuery<GetThemeQuery>(GET_THEME_QUERY, null, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const mapPublicTheme = (publicTheme?: GetThemeQuery['publicTheme'] | null): Theme | null => {
    if (!publicTheme) {
      return null;
    }

    return sanitizeTheme({
      name: publicTheme.name?.toLowerCase(),
      banner: publicTheme.showBannerImage,
      bannerGradient: publicTheme.showBannerGradient,
      bgColor: publicTheme.headerBackgroundColor ?? undefined,
      descriptionShow: publicTheme.showHeaderDescription,
      metaColor: publicTheme.headerSecondaryTextColor ?? undefined,
      textColor: publicTheme.headerPrimaryTextColor ?? undefined,
    });
  };

  const applyThemeFromQuery = (publicTheme?: GetThemeQuery['publicTheme'] | null) => {
    const sanitized = mapPublicTheme(publicTheme);
    if (!sanitized) {
      return;
    }

    setTheme(sanitized, { source: 'server' });
  };

  onResult(({ data }) => {
    if (data?.publicTheme) {
      applyThemeFromQuery(data.publicTheme);
    }
  });

  onError((err) => {
    console.warn('Failed to load theme from server, keeping existing theme:', err);
  });

  // Getters - read from DOM CSS variables set by PHP
  const themeName = computed<string>(() => {
    if (!isDomAvailable()) return DEFAULT_THEME.name;
    const name = readDomThemeName() || theme.value.name;
    return name || DEFAULT_THEME.name;
  });

  const darkMode = computed<boolean>(() => isDarkModeActive());

  const readBannerGradientVar = (): string => {
    const raw = getCssVar('--banner-gradient');
    if (!raw) return '';
    const normalized = raw.trim().toLowerCase();
    if (!normalized || normalized === 'null' || normalized === 'none' || normalized === 'undefined') {
      return '';
    }
    return raw;
  };

  const bannerGradient = computed(() => {
    if (darkMode.value) {
      return undefined;
    }
    const { banner, bannerGradient } = theme.value;
    if (!banner || !bannerGradient) {
      return undefined;
    }
    const gradient = readBannerGradientVar();
    // Only return gradient if CSS variable is set and not empty
    // CSS variable is only set by PHP when both banner and gradient are enabled
    if (gradient) {
      return `background-image: ${gradient};`;
    }
    // No fallback - only use CSS variable set by PHP
    return undefined;
  });

  // Actions
  function setTheme(data?: Partial<Theme>, options: { source?: ThemeSource } = {}) {
    if (data) {
      const { source = 'local' } = options;

      if (source === 'server') {
        hasServerTheme.value = true;
      } else if (hasServerTheme.value && !devOverride.value) {
        return;
      }

      const sanitized = sanitizeTheme({
        ...theme.value,
        ...data,
      });

      if (sanitized) {
        theme.value = sanitized;
        const fallbackTheme = defaultColors[sanitized.name as keyof typeof defaultColors];
        activeColorVariables.value = {
          ...(fallbackTheme ?? defaultColors.white),
        };
      }
    }
  }

  const setDevOverride = (enabled: boolean) => {
    devOverride.value = enabled;
  };

  const fetchTheme = () => {
    load();
  };

  // Only apply dark class when theme changes (for dev tools that don't refresh)
  // In production, PHP sets the dark class and page refreshes on theme change
  watch(
    () => theme.value.name,
    (themeName) => {
      const isDark = DARK_UI_THEMES.includes(themeName as (typeof DARK_UI_THEMES)[number]);
      applyDarkClass(isDark);
    },
    { immediate: false }
  );

  // Initialize theme from DOM on store creation
  const domThemeName = themeName.value;
  if (domThemeName && domThemeName !== DEFAULT_THEME.name) {
    theme.value.name = domThemeName;
  }

  return {
    // state
    activeColorVariables,
    bannerGradient,
    darkMode,
    theme: computed(() => ({
      ...theme.value,
      name: themeName.value,
    })),
    // actions
    setTheme,
    setDevOverride,
    fetchTheme,
  };
});
