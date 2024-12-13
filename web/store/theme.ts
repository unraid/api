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

interface ColorMode {
  headerTextPrimary: string;
  headerTextSecondary: string;
  headerBackgroundColor: string;
}

export const defaultColors: Record<string, ColorMode> = {
  dark: {
    headerTextPrimary: '#1c1c1c',
    headerBackgroundColor: '#f2f2f2',
    headerTextSecondary: '#999999',
  },
  light: {
    headerTextPrimary: '#f2f2f2',
    headerBackgroundColor: '#1c1b1b',
    headerTextSecondary: '#999999',
  },
};

const lightVariables = {
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
};

const darkVariables = {
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
};

export const useThemeStore = defineStore('theme', () => {
  // State
  const theme = ref<Theme | undefined>();
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
    const body = document.body;

    let { headerTextPrimary, headerTextSecondary, headerBackgroundColor } = darkMode.value
      ? defaultColors.dark
      : defaultColors.light;
    // overwrite with hex colors set in webGUI @ /Settings/DisplaySettings
    if (theme.value?.textColor) {
      headerTextPrimary = theme.value?.textColor;
    }
    if (theme.value?.bgColor) {
      headerBackgroundColor = theme.value.bgColor;
      body.style.setProperty('--color-customgradient-start', hexToRgba(headerBackgroundColor, 0));
      body.style.setProperty('--color-customgradient-end', hexToRgba(headerBackgroundColor, 0.7));
    }
    if (theme.value?.metaColor) {
      headerTextSecondary = theme.value?.metaColor;
    }

    body.style.setProperty('--header-text-primary', headerTextPrimary);
    body.style.setProperty('--header-text-secondary', headerTextSecondary);
    body.style.setProperty('--header-background-color', headerBackgroundColor);
    
    if (darkMode.value) {
      Object.entries(darkVariables).forEach(([key, value]) => {
        body.style.setProperty(key, value);
      });
      document.body.classList.add('dark');
    } else {
      Object.entries(lightVariables).forEach(([key, value]) => {
        body.style.setProperty(key, value);
      });
      document.body.classList.remove('dark');
    }
  };

  watch(theme, () => {
    setCssVars();
  });

  return {
    // state
    bannerGradient,
    darkMode,
    theme,
    // actions
    setTheme,
  };
});
