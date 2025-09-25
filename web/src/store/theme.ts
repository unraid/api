import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useLazyQuery } from '@vue/apollo-composable';

import { defaultColors } from '~/themes/default';
import hexToRgba from 'hex-to-rgba';

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

export const useThemeStore = defineStore('theme', () => {
  // State
  const theme = ref<Theme>({
    name: 'white',
    banner: false,
    bannerGradient: false,
    bgColor: '',
    descriptionShow: false,
    metaColor: '',
    textColor: '',
  });

  const { load } = useLazyQuery(GET_THEME_QUERY);

  const activeColorVariables = ref<ThemeVariables>(defaultColors.white);

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
  const setTheme = async (data?: Theme) => {
    if (data) {
      theme.value = data;
    } else {
      try {
        const result = await load();
        if (result && result.publicTheme) {
          theme.value = {
            name: result.publicTheme.name?.toLowerCase() || 'white',
            banner: result.publicTheme.showBannerImage ?? false,
            bannerGradient: result.publicTheme.showBannerGradient ?? false,
            bgColor: result.publicTheme.headerBackgroundColor || '',
            descriptionShow: result.publicTheme.showHeaderDescription ?? false,
            metaColor: result.publicTheme.headerSecondaryTextColor || '',
            textColor: result.publicTheme.headerPrimaryTextColor || '',
          };
          return;
        }
      } catch (error) {
        console.warn('Failed to load theme from server, using default:', error);
      }

      // Single fallback for both no data and error cases
      theme.value = {
        name: 'white',
        banner: false,
        bannerGradient: false,
        bgColor: '',
        descriptionShow: false,
        metaColor: '',
        textColor: '',
      };
    }
  };

  const setCssVars = () => {
    const selectedTheme = theme.value.name;

    // Prepare Tailwind v4 theme classes
    const themeClasses: string[] = [];
    const customClasses: string[] = [];

    // Apply dark/light mode using Tailwind v4 theme switching
    if (darkMode.value) {
      themeClasses.push('dark');
    }

    // Apply theme-specific class for Tailwind v4 theme variants
    themeClasses.push(`theme-${selectedTheme}`);

    // Only set CSS variables for dynamic/user-configured values from GraphQL
    // Static theme values are handled by Tailwind v4 theme classes in @tailwind-shared
    const dynamicVars: Record<string, string> = {};

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
      dynamicVars['--custom-header-background-color'] = theme.value.bgColor;
      dynamicVars['--custom-header-gradient-start'] = hexToRgba(theme.value.bgColor, 0);
      dynamicVars['--custom-header-gradient-end'] = hexToRgba(theme.value.bgColor, 0.7);
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
    }

    requestAnimationFrame(() => {
      const scopedTargets: HTMLElement[] = [
        document.documentElement,
        ...Array.from(document.querySelectorAll<HTMLElement>('.unapi')),
      ];

      const cleanClassList = (classList: string) =>
        classList
          .split(' ')
          .filter((c) => !c.startsWith('theme-') && c !== 'dark' && !c.startsWith('has-custom-'))
          .filter(Boolean)
          .join(' ');

      // Apply theme and custom classes to html element and all .unapi roots
      scopedTargets.forEach((target) => {
        target.className = cleanClassList(target.className);
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
      const hasDynamicVars = Object.keys(dynamicVars).length > 0;
      if (hasDynamicVars) {
        scopedTargets.forEach((target) => {
          Object.entries(dynamicVars).forEach(([key, value]) => {
            target.style.setProperty(key, value);
          });
        });
      }

      // Store active variables for reference (from defaultColors for compatibility)
      const customTheme = { ...defaultColors[selectedTheme] };
      activeColorVariables.value = customTheme;
    });
  };

  watch(theme, () => {
    setCssVars();
  });

  return {
    // state
    activeColorVariables,
    bannerGradient,
    darkMode,
    theme,
    // actions
    setTheme,
    setCssVars,
  };
});
