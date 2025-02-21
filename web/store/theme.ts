import { createPinia, defineStore, setActivePinia } from 'pinia';

import hexToRgba from 'hex-to-rgba';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export interface Theme {
  banner: boolean;
  bannerGradient: boolean;
  bgColor: string;
  descriptionShow: boolean;
  metaColor: string;
  name: string;
  textColor: string;
}

interface ThemeVariables {
  [key: string]: string | null;
}

/**
 * Defines legacy colors that are kept for backwards compatibility
 *
 * Allows theme-engine to be updated without breaking existing themes
 */
const legacyColors = {
  '--color-alpha': 'var(--header-background-color)',
  '--color-beta': 'var(--header-text-primary)',
  '--color-gamma': 'var(--header-text-secondary)',
  '--color-gamma-opaque': 'rgba(153, 153, 153, .5)',
  '--color-customgradient-start': 'rgba(242, 242, 242, .0)',
  '--color-customgradient-end': 'rgba(242, 242, 242, .85)',
  '--shadow-beta': '0 25px 50px -12px rgba(242, 242, 242, .15)',
};

const defaultLight = {
  '--background': '0 0% 3.9%',
  '--foreground': '0 0% 98%',
  '--muted': '0 0% 14.9%',
  '--muted-foreground': '0 0% 63.9%',
  '--popover': '0 0% 3.9%',
  '--popover-foreground': '0 0% 98%',
  '--card': '0 0% 14.9%',
  '--card-foreground': '0 0% 98%',
  '--border': '0 0% 20%',
  '--input': '0 0% 14.9%',
  '--primary': '24 100% 50%',
  '--primary-foreground': '0 0% 98%',
  '--secondary': '0 0% 14.9%',
  '--secondary-foreground': '0 0% 77%',
  '--accent': '0 0% 14.9%',
  '--accent-foreground': '0 0% 98%',
  '--destructive': '0 62.8% 30.6%',
  '--destructive-foreground': '0 0% 98%',
  '--ring': '0 0% 83.1%',
  '--header-text-primary': '#f2f2f2',
  '--header-text-secondary': '#999999',
  '--header-background-color': '#1c1b1b',
  '--header-gradient-start': 'rgba(0, 0, 0, 0)',
  '--header-gradient-end': 'var(--header-background-color)',
  '--banner-gradient': null,
  ...legacyColors,
} as const;

const defaultDark = {
  '--background': '0 0% 100%',
  '--foreground': '0 0% 3.9%',
  '--muted': '0 0% 96.1%',
  '--muted-foreground': '0 0% 45.1%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '0 0% 3.9%',
  '--card': '0 0% 100%',
  '--card-foreground': '0 0% 3.9%',
  '--border': '0 0% 89.8%',
  '--input': '0 0% 89.8%',
  '--primary': '24 100% 50%',
  '--primary-foreground': '0 0% 98%',
  '--secondary': '0 0% 96.1%',
  '--secondary-foreground': '0 0% 45%',
  '--accent': '0 0% 96.1%',
  '--accent-foreground': '0 0% 9%',
  '--destructive': '0 84.2% 60.2%',
  '--destructive-foreground': '0 0% 98%',
  '--ring': '0 0% 3.9%',
  '--radius': '0.5rem',
  '--header-text-primary': '#1c1c1c',
  '--header-text-secondary': '#999999',
  '--header-background-color': '#f2f2f2',
  '--header-gradient-start': 'rgba(0, 0, 0, 0)',
  '--header-gradient-end': 'var(--header-background-color)',
  '--banner-gradient': null,
  ...legacyColors,
} as const;

/**
 * Color Explanation:
 * White (base light theme): has dark header background and light text
 * Black (base dark theme): has light header background and dark text
 * Gray (base dark theme): has dark header background and light text
 * Azure (base light theme): has light header background and dark text
 */
export const defaultColors: Record<string, ThemeVariables> = {
  white: {
    ...defaultLight,
  },
  black: {
    ...defaultDark,
  },
  gray: {
    ...defaultDark,
    '--header-text-primary': '#39587f',
    '--header-text-secondary': '#606e7f',
    '--header-background-color': '#1c1b1b',
  },
  azure: {
    ...defaultDark,
    '--header-text-primary': '#39587f',
    '--header-text-secondary': '#606e7f',
    '--header-background-color': '#f2f2f2',
  },
} as const;

// used to swap the UPC text color when using the azure or gray theme
export const DARK_THEMES = ['black', 'gray'] as const;

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
  const setTheme = (data: Theme) => {
    theme.value = data;
  };

  const setCssVars = () => {
    const body: HTMLBodyElement = document.body as HTMLBodyElement;
    const selectedTheme = theme.value.name;
    const customTheme = structuredClone(defaultColors[selectedTheme]);
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

    if (darkMode.value) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    body.style.cssText = createCssText(customTheme, body);
    activeColorVariables.value = customTheme;
  };

  /**
   * Creates a string of CSS rules preserving existing rules that are not defined in the theme variables
   * @param themeVariables - The theme variables to apply
   * @param body - The body element to apply the CSS to
   * @returns A string of CSS rules
   */
  const createCssText = (themeVariables: ThemeVariables, body: HTMLBodyElement) => {
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
  };
});
