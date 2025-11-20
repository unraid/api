import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { defaultColors } from '~/themes/default';
import hexToRgba from 'hex-to-rgba';

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

export const THEME_STORAGE_KEY = 'unraid.theme.publicTheme';

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

const DYNAMIC_VAR_KEYS = [
  '--custom-header-text-primary',
  '--custom-header-text-secondary',
  '--custom-header-background-color',
  '--custom-header-gradient-start',
  '--custom-header-gradient-end',
  '--header-background-color',
  '--header-gradient-start',
  '--header-gradient-end',
  '--color-header-background',
  '--color-header-gradient-start',
  '--color-header-gradient-end',
  '--banner-gradient',
] as const;

type DynamicVarKey = (typeof DYNAMIC_VAR_KEYS)[number];

export const useThemeStore = defineStore(
  'theme',
  () => {
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
    const setTheme = (data?: Partial<Theme>, options: { source?: ThemeSource } = {}) => {
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
        }
      }
    };

    const setDevOverride = (enabled: boolean) => {
      devOverride.value = enabled;
    };

    const setCssVars = () => {
      const selectedTheme = theme.value.name;

      // Check if Unraid PHP has already set a Theme-- class
      const hasExistingThemeClass =
        typeof document !== 'undefined' &&
        Array.from(document.documentElement.classList).some((cls) => cls.startsWith('Theme--'));

      // Prepare Tailwind v4 theme classes
      const themeClasses: string[] = [];
      const customClasses: string[] = [];

      // Apply dark/light mode using Tailwind v4 theme switching
      if (darkMode.value) {
        themeClasses.push('dark');
      }

      // Only apply theme-specific class if Unraid PHP hasn't already set it
      if (!hasExistingThemeClass) {
        themeClasses.push(`Theme--${selectedTheme}`);
      }

      // Only set CSS variables for dynamic/user-configured values from GraphQL
      // Static theme values are handled by Tailwind v4 theme classes in @tailwind-shared
      const dynamicVars: Partial<Record<DynamicVarKey, string>> = {};

      // User-configured colors from webGUI @ /Settings/DisplaySettings
      if (theme.value.textColor) {
        dynamicVars['--custom-header-text-primary'] = theme.value.textColor;
        customClasses.push('has-custom-header-text');
      }
      if (theme.value.metaColor) {
        dynamicVars['--custom-header-text-secondary'] = theme.value.metaColor;
        customClasses.push('has-custom-header-meta');
      }

      if (theme.value.bgColor) {
        const gradientStart = hexToRgba(theme.value.bgColor, 0);
        const gradientEnd = hexToRgba(theme.value.bgColor, 0.7);

        dynamicVars['--custom-header-background-color'] = theme.value.bgColor;
        dynamicVars['--custom-header-gradient-start'] = gradientStart;
        dynamicVars['--custom-header-gradient-end'] = gradientEnd;

        // Apply the resolved values directly to ensure they override base theme vars
        dynamicVars['--header-background-color'] = theme.value.bgColor;
        dynamicVars['--header-gradient-start'] = gradientStart;
        dynamicVars['--header-gradient-end'] = gradientEnd;
        dynamicVars['--color-header-background'] = theme.value.bgColor;
        dynamicVars['--color-header-gradient-start'] = gradientStart;
        dynamicVars['--color-header-gradient-end'] = gradientEnd;
        customClasses.push('has-custom-header-bg');
      }

      // Set banner gradient if needed
      if (theme.value.banner && theme.value.bannerGradient) {
        const start = theme.value.bgColor
          ? hexToRgba(theme.value.bgColor, 0)
          : 'var(--header-gradient-start)';
        const end = theme.value.bgColor
          ? hexToRgba(theme.value.bgColor, 0.7)
          : 'var(--header-gradient-end)';

        dynamicVars['--banner-gradient'] = `linear-gradient(90deg, ${start} 0, ${end} 90%)`;
        customClasses.push('has-banner-gradient');
      }

      requestAnimationFrame(() => {
        const scopedTargets: HTMLElement[] = [
          document.documentElement,
          ...Array.from(document.querySelectorAll<HTMLElement>('.unapi')),
        ];

        const styleTargets = [...scopedTargets, document.body].filter(Boolean) as HTMLElement[];

        const cleanClassList = (classList: string, isDocumentElement: boolean) => {
          // Don't remove Theme-- classes from documentElement if Unraid PHP set them
          if (isDocumentElement && hasExistingThemeClass) {
            return classList
              .split(' ')
              .filter((c) => c !== 'dark' && !c.startsWith('has-custom-') && c !== 'has-banner-gradient')
              .filter(Boolean)
              .join(' ');
          }
          // For .unapi roots or when we're managing the theme class, clean everything
          return classList
            .split(' ')
            .filter(
              (c) =>
                !c.startsWith('Theme--') &&
                c !== 'dark' &&
                !c.startsWith('has-custom-') &&
                c !== 'has-banner-gradient'
            )
            .filter(Boolean)
            .join(' ');
        };

        // Apply theme and custom classes to html element and all .unapi roots
        scopedTargets.forEach((target) => {
          const isDocumentElement = target === document.documentElement;
          target.className = cleanClassList(target.className, isDocumentElement);
          [...themeClasses, ...customClasses].forEach((cls) => target.classList.add(cls));

          if (darkMode.value) {
            target.classList.add('dark');
          } else {
            target.classList.remove('dark');
          }
        });

        // Maintain dark mode flag on body for legacy components
        if (darkMode.value) {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }

        // Only apply dynamic CSS variables for custom user values
        // All theme defaults are handled by classes in @tailwind-shared/theme-variants.css
        const activeDynamicKeys = Object.keys(dynamicVars) as DynamicVarKey[];

        styleTargets.forEach((target) => {
          activeDynamicKeys.forEach((key) => {
            const value = dynamicVars[key];
            if (value !== undefined) {
              target.style.setProperty(key, value);
            }
          });

          DYNAMIC_VAR_KEYS.forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(dynamicVars, key)) {
              target.style.removeProperty(key);
            }
          });
        });

        // Store active variables for reference (from defaultColors for compatibility)
        const customTheme = { ...defaultColors[selectedTheme] };
        activeColorVariables.value = customTheme;
      });
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
  },
  {
    persist: {
      key: THEME_STORAGE_KEY,
      pick: ['theme'],
      afterHydrate: (ctx) => {
        const store = ctx.store as ReturnType<typeof useThemeStore>;
        store.setTheme(store.theme);
        store.setCssVars();
      },
    },
  }
);
