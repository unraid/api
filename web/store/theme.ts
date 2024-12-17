import hexToRgba from 'hex-to-rgba';
import { createPinia, defineStore, setActivePinia } from 'pinia';


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
    '--border': '0 0% 14.9%',
    '--input': '0 0% 14.9%',
    '--primary': '24 100% 50%',
    '--primary-foreground': '0 0% 98%',
    '--secondary': '0 0% 14.9%',
    '--secondary-foreground': '0 0% 98%',
    '--accent': '0 0% 14.9%',
    '--accent-foreground': '0 0% 98%',
    '--destructive': '0 62.8% 30.6%',
    '--destructive-foreground': '0 0% 98%',
    '--ring': '0 0% 83.1%',
    '--header-text-primary': '#1c1c1c',
    '--header-text-secondary': '#999999',
    '--header-background-color': '#f2f2f2',
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
    '--secondary-foreground': '0 0% 9%',
    '--accent': '0 0% 96.1%',
    '--accent-foreground': '0 0% 9%',
    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '0 0% 98%',
    '--ring': '0 0% 3.9%',
    '--radius': '0.5rem',
    '--header-text-primary': '#f2f2f2',
    '--header-text-secondary': '#999999',
    '--header-background-color': '#1c1b1b',
  },
};

export const useThemeStore = defineStore('theme', () => {
  // State
  const theme = ref<Theme | undefined>();

  const activeColorVariables = ref<ThemeVariables>(defaultColors.light);
  // Getters
  const darkMode = computed(
    () => (theme.value?.name === 'black' || theme.value?.name === 'azure') ?? false
  );
  // used to swap the UPC text color when using the azure or gray theme
  const bannerGradient = computed(() => {
    if (!theme.value?.banner || !theme.value?.bannerGradient) {
      return undefined;
    }
    const start = theme.value?.bgColor ? 'var(--color-customgradient-start)' : 'rgba(0, 0, 0, 0)';
    const end = theme.value?.bgColor ? 'var(--color-customgradient-end)' : 'var(--color-beta)';
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

    // overwrite with hex colors set in webGUI @ /Settings/DisplaySettings
    if (theme.value?.textColor) {
      customColorVariables[selectedMode]['--header-text-primary'] = theme.value.textColor;
    }
    if (theme.value?.metaColor) {
      customColorVariables[selectedMode]['--header-text-secondary'] = theme.value.metaColor;
    }
    if (theme.value?.bgColor) {
      customColorVariables[selectedMode]['--header-background-color'] = theme.value.bgColor;

      body.style.setProperty('--color-customgradient-start', hexToRgba(theme.value.bgColor, 0));
      body.style.setProperty('--color-customgradient-end', hexToRgba(theme.value.bgColor, 0.7));
    }

    Object.entries(customColorVariables[selectedMode]).forEach(([key, value]) => {
      body.style.setProperty(key, value);
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