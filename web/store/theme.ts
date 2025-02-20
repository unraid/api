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
  [key: string]: string;
}

export const defaultColors: Record<string, ThemeVariables> = {
  dark: {
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
    '--header-text-primary': '#1c1c1c',
    '--header-text-secondary': '#999999',
    '--header-background-color': '#f2f2f2',
    '--gradient-start': 'rgba(0, 0, 0, 0)',
    '--gradient-end': 'var(--header-background-color)',
  },
  light: {
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
    '--header-text-primary': '#f2f2f2',
    '--header-text-secondary': '#999999',
    '--header-background-color': '#1c1b1b',
    '--gradient-start': 'rgba(0, 0, 0, 0)',
    '--gradient-end': 'var(--header-background-color)',
  },
} as const;

/**
 * Unraid default theme colors do not have consistent colors for the header.
 * This is a workaround to set the correct colors for the header.
 * DARK THEMES: black, gray
 * DARK HEADER THEMES: white, gray
 * LIGHT THEMES: white, gray
 * LIGHT HEADER THEMES: black, gray
 */
export const defaultAzureGrayHeaderColors: ThemeVariables = {
  // azure and gray header colors are the same but the background color is different
  '--header-text-primary': '#39587f',
  '--header-text-secondary': '#606e7f',
};
export const defaultHeaderColors: Record<string, ThemeVariables> = {
  azure: {
    ...defaultAzureGrayHeaderColors,
    '--header-background-color': '#1c1b1b',
  },
  black: {
    '--header-text-primary': '#1c1c1c',
    '--header-text-secondary': '#999999',
    '--header-background-color': '#f2f2f2',
  },
  gray: {
    ...defaultAzureGrayHeaderColors,
    '--header-background-color': '#f2f2f2',
  },
  white: {
    '--header-text-primary': '#f2f2f2',
    '--header-text-secondary': '#999999',
    '--header-background-color': '#1c1b1b',
  },
};

// used to swap the UPC text color when using the azure or gray theme
export const DARK_THEMES = ['black', 'gray'] as const;

export const useThemeStore = defineStore('theme', () => {
  // State
  const theme = ref<Theme | undefined>();

  const activeColorVariables = ref<ThemeVariables>({
    ...defaultColors.light,
    ...defaultHeaderColors['white'],
  });

  // Getters
  const darkMode = computed<boolean>(
    () => DARK_THEMES.includes(theme.value?.name as (typeof DARK_THEMES)[number]) ?? false
  );

  const bannerGradient = computed(() => {
    if (!theme.value?.banner || !theme.value?.bannerGradient) {
      return undefined;
    }
    const start = theme.value?.bgColor ? 'var(--gradient-start)' : 'rgba(0, 0, 0, 0)';
    const end = theme.value?.bgColor ? 'var(--gradient-end)' : 'var(--header-background-color)';
    return `background-image: linear-gradient(90deg, ${start} 0, ${end} 30%);`;
  });
  // Actions
  const setTheme = (data: Theme) => {
    theme.value = data;
  };

  const setCssVars = () => {
    const customColorVariables = structuredClone(defaultColors);
    const body = document.body;
    const selectedMode = darkMode.value ? 'dark' : 'light';

    // set the default header colors for the current theme
    const themeName = theme.value?.name;
    if (themeName && themeName in defaultHeaderColors) {
      customColorVariables[selectedMode] = {
        ...customColorVariables[selectedMode],
        ...defaultHeaderColors[themeName],
      };
    }

    // Set banner gradient if enabled
    if (theme.value?.banner && theme.value?.bannerGradient) {
      const start = theme.value?.bgColor
        ? hexToRgba(theme.value.bgColor, 0)
        : customColorVariables[selectedMode]['--gradient-start'];
      const end = theme.value?.bgColor
        ? hexToRgba(theme.value.bgColor, 0.7)
        : customColorVariables[selectedMode]['--gradient-end'];
      body.style.setProperty('--banner-gradient', `linear-gradient(90deg, ${start} 0, ${end} 30%)`);
    } else {
      body.style.removeProperty('--banner-gradient');
    }

    // overwrite with hex colors set in webGUI @ /Settings/DisplaySettings
    if (theme.value?.textColor) {
      body.style.setProperty('--header-text-primary', theme.value.textColor);
    } else {
      body.style.setProperty(
        '--header-text-primary',
        customColorVariables[selectedMode]['--header-text-primary']
      );
    }
    if (theme.value?.metaColor) {
      body.style.setProperty('--header-text-secondary', theme.value.metaColor);
    } else {
      body.style.setProperty(
        '--header-text-secondary',
        customColorVariables[selectedMode]['--header-text-secondary']
      );
    }
    if (theme.value?.bgColor) {
      body.style.setProperty('--header-background-color', theme.value.bgColor);
      body.style.setProperty('--gradient-start', hexToRgba(theme.value.bgColor, 0));
      body.style.setProperty('--gradient-end', hexToRgba(theme.value.bgColor, 0.7));
    } else {
      body.style.setProperty(
        '--header-background-color',
        customColorVariables[selectedMode]['--header-background-color']
      );
    }

    // Apply all other CSS variables
    Object.entries(customColorVariables[selectedMode]).forEach(([key, value]) => {
      if (!key.startsWith('--header-')) {
        body.style.setProperty(key, value);
      }
    });

    if (darkMode.value) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    activeColorVariables.value = customColorVariables[selectedMode];
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
