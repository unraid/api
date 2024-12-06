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
  alpha: string;
  beta: string;
  gamma: string;
}

export const defaultColors: Record<string, ColorMode> = {
  dark: {
    alpha: '#1c1c1c', // previously header custom text color
    beta: '#f2f2f2', // previously header background color
    gamma: '#999999', // previously header custom secondary text color
    headerTextPrimary: '#1c1c1c',
    headerBackgroundColor: '#f2f2f2',
    headerTextSecondary: '#999999',
  },
  light: {
    alpha: '#f2f2f2', // previously header custom text color
    beta: '#1c1b1b', // previously header background color
    gamma: '#999999', // previously header custom secondary text color
    headerTextPrimary: '#f2f2f2',
    headerBackgroundColor: '#1c1b1b',
    headerTextSecondary: '#999999',
  },
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

    let { alpha, beta, gamma, headerTextPrimary, headerTextSecondary, headerBackgroundColor } =
      darkMode.value ? defaultColors.dark : defaultColors.light;
    // overwrite with hex colors set in webGUI @ /Settings/DisplaySettings
    if (theme.value?.textColor) {
      headerTextPrimary = theme.value?.textColor;
    }
    if (theme.value?.bgColor) {
      headerBackgroundColor = theme.value.bgColor;
      body.style.setProperty('--color-customgradient-start', hexToRgba(beta, 0));
      body.style.setProperty('--color-customgradient-end', hexToRgba(beta, 0.7));
    }
    if (theme.value?.metaColor) {
      headerTextSecondary = theme.value?.metaColor;
    }
    body.style.setProperty('--color-alpha', alpha);
    body.style.setProperty('--color-beta', beta);
    body.style.setProperty('--color-gamma', gamma);
    body.style.setProperty('--header-text-primary', headerTextPrimary);
    body.style.setProperty('--header-text-secondary', headerTextSecondary);
    body.style.setProperty('--header-background-color', headerBackgroundColor);
    body.style.setProperty('--color-gamma-opaque', hexToRgba(gamma, 0.25));
    // box shadow
    body.style.setProperty('--shadow-beta', `0 25px 50px -12px ${hexToRgba(beta, 0.15)}`);
    body.style.setProperty('--ring-offset-shadow', `0 0 ${beta}`);
    body.style.setProperty('--ring-shadow', `0 0 ${beta}`);
    body.style.setProperty('--dev-test', `0 0 ${beta}`);

    if (darkMode.value) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  watch(theme, () => {
    console.log(theme.value);
    console.log('theme changed');
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
