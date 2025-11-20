import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

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

let pendingDarkModeHandler: ((event: Event) => void) | null = null;

const syncBodyDarkClass = (method: 'add' | 'remove'): boolean => {
  const body = typeof document !== 'undefined' ? document.body : null;
  if (!body) {
    return false;
  }

  body.classList[method]('dark');
  return true;
};

const applyDarkClass = (isDark: boolean) => {
  if (typeof document === 'undefined') return;

  const method: 'add' | 'remove' = isDark ? 'add' : 'remove';
  document.documentElement.classList[method]('dark');

  if (pendingDarkModeHandler) {
    document.removeEventListener('DOMContentLoaded', pendingDarkModeHandler);
    pendingDarkModeHandler = null;
  }

  if (syncBodyDarkClass(method)) {
    return;
  }

  const handler = () => {
    if (syncBodyDarkClass(method)) {
      document.removeEventListener('DOMContentLoaded', handler);
      if (pendingDarkModeHandler === handler) {
        pendingDarkModeHandler = null;
      }
    }
  };

  pendingDarkModeHandler = handler;
  document.addEventListener('DOMContentLoaded', handler);
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

  const { result, onResult, onError } = useQuery<GetThemeQuery>(GET_THEME_QUERY, null, {
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

  if (result.value?.publicTheme) {
    applyThemeFromQuery(result.value.publicTheme);
  }

  onError((err) => {
    console.warn('Failed to load theme from server, keeping existing theme:', err);
  });

  // Getters
  // Apply dark mode for gray and black themes
  const darkMode = computed<boolean>(() =>
    DARK_UI_THEMES.includes(theme.value?.name as (typeof DARK_UI_THEMES)[number])
  );

  const bannerGradient = computed(() => {
    if (!theme.value?.banner || !theme.value?.bannerGradient) {
      return undefined;
    }
    const start = theme.value?.bgColor ? 'var(--header-gradient-start)' : 'rgba(0, 0, 0, 0)';
    const end = theme.value?.bgColor ? 'var(--header-gradient-end)' : 'var(--header-background-color)';
    return `background-image: linear-gradient(90deg, ${start} 0, ${end} 90%);`;
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

  const setCssVars = () => {
    applyDarkClass(darkMode.value);
  };

  watch(
    theme,
    () => {
      setCssVars();
    },
    { immediate: true }
  );

  return {
    // state
    activeColorVariables,
    bannerGradient,
    darkMode,
    theme,
    // actions
    setTheme,
    setCssVars,
    setDevOverride,
  };
});
