import { computed, ref, watch } from 'vue';
import { createPinia, defineStore, setActivePinia } from 'pinia';
import { useLazyQuery } from '@vue/apollo-composable';

import { defaultColors } from '~/themes/default';
import hexToRgba from 'hex-to-rgba';

import type { Theme, ThemeVariables } from '~/themes/types';

import { graphql } from '~/composables/gql/gql';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

// used to swap the UPC text color when using the azure or gray theme
export const DARK_THEMES = ['black', 'gray'] as const;

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
  const darkMode = computed<boolean>(
    () => DARK_THEMES.includes(theme.value?.name as (typeof DARK_THEMES)[number]) ?? false
  );

  const bannerGradient = computed(() => {
    if (!theme.value?.banner || !theme.value?.bannerGradient) {
      return undefined;
    }
    const start = theme.value?.bgColor ? 'var(--header-gradient-start)' : 'rgba(0, 0, 0, 0)';
    const end = theme.value?.bgColor ? 'var(--header-gradient-end)' : 'var(--header-background-color)';
    return `background-image: linear-gradient(90deg, ${start} 0, ${end} 30%);`;
  });
  // Actions
  const setTheme = async (data?: Theme) => {
    if (data) {
      theme.value = data;
    } else {
      const result = await load();
      if (result) {
        if (result.publicTheme) {
          theme.value = {
            name: result.publicTheme.name.toLowerCase(),
            banner: result.publicTheme.showBannerImage,
            bannerGradient: result.publicTheme.showBannerGradient,
            bgColor: result.publicTheme.headerBackgroundColor,
            descriptionShow: result.publicTheme.showHeaderDescription,
            metaColor: result.publicTheme.headerSecondaryTextColor || '',
            textColor: result.publicTheme.headerPrimaryTextColor,
          };
        }
      }
    }
  };

  const setCssVars = () => {
    const selectedTheme = theme.value.name;
    const customTheme = { ...defaultColors[selectedTheme] };
    // Set banner gradient if enabled
    if (theme.value.banner && theme.value.bannerGradient) {
      const start = theme.value.bgColor
        ? hexToRgba(theme.value.bgColor, 0)
        : customTheme['--header-gradient-start'];
      const end = theme.value.bgColor
        ? hexToRgba(theme.value.bgColor, 0.7)
        : customTheme['--header-gradient-end'];

      // set the banner gradient
      customTheme['--banner-gradient'] = `linear-gradient(90deg, ${start} 0, ${end} 30%)`;
    }

    // overwrite with hex colors set in webGUI @ /Settings/DisplaySettings
    if (theme.value.textColor) {
      customTheme['--header-text-primary'] = theme.value.textColor;
    }
    if (theme.value.metaColor) {
      customTheme['--header-text-secondary'] = theme.value.metaColor;
    }

    if (theme.value.bgColor) {
      customTheme['--header-background-color'] = theme.value.bgColor;
      customTheme['--header-gradient-start'] = hexToRgba(theme.value.bgColor, 0);
      customTheme['--header-gradient-end'] = hexToRgba(theme.value.bgColor, 0.7);
    }

    requestAnimationFrame(() => {
      if (darkMode.value) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }

      document.body.style.cssText = createCssText(customTheme, document.body);
      activeColorVariables.value = customTheme;
    });
  };

  /**
   * Creates a string of CSS rules preserving existing rules that are not defined in the theme variables
   * @param themeVariables - The theme variables to apply
   * @param body - The body element to apply the CSS to
   * @returns A string of CSS rules
   */
  const createCssText = (themeVariables: ThemeVariables, body: HTMLElement) => {
    const existingStyles = body.style.cssText
      .split(';')
      .filter((rule) => rule.trim())
      .filter((rule) => {
        // Keep rules that aren't in our theme variables
        return !Object.keys(themeVariables).some((themeVar) => rule.startsWith(themeVar));
      });

    const themeStyles = Object.entries(themeVariables).reduce((acc, [key, value]) => {
      if (value) acc.push(`${key}: ${value}`);
      return acc;
    }, [] as string[]);

    return [...existingStyles, ...themeStyles].join(';');
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
