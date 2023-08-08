import { defineStore, createPinia, setActivePinia } from 'pinia';
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

export const useThemeStore = defineStore('theme', () => {
  // State
  const theme = ref<Theme | undefined>();
  // Getters
  const darkMode = computed(() => (theme.value?.name === 'black' || theme.value?.name === 'azure') ?? false);
  const bannerGradient = computed(() => {
    if (!theme.value?.banner || !theme.value?.bannerGradient) { return undefined; }
    const start = theme.value?.bgColor ? 'var(--color-customgradient-start)' : 'rgba(0, 0, 0, 0)';
    const end = theme.value?.bgColor ? 'var(--color-customgradient-end)' : 'var(--color-beta)';
    return `background-image: linear-gradient(90deg, ${start} 0, ${end} 30%);`;
  });
  // Actions
  const setTheme = (data: Theme) => {
    console.debug('[setTheme]');
    theme.value = data;
  };
  const setCssVars = () => {
    const body = document.body;
    const defaultColors = {
      darkTheme: {
        alpha: '#1c1b1b',
        beta: '#f2f2f2',
        gamma: '#999999',
      },
      lightTheme: {
        alpha: '#f2f2f2',
        beta: '#1c1b1b',
        gamma: '#999999',
      },
    };
    let { alpha, beta, gamma } = darkMode.value ? defaultColors.darkTheme : defaultColors.lightTheme;
    // overwrite with hex colors set in webGUI @ /Settings/DisplaySettings
    if (theme.value?.textColor) { alpha = theme.value?.textColor; }
    if (theme.value?.bgColor) {
      beta = theme.value?.bgColor;
      body.style.setProperty('--color-customgradient-start', hexToRgba(beta, 0));
      body.style.setProperty('--color-customgradient-end', hexToRgba(beta, 0.7));
    }
    if (theme.value?.metaColor) { gamma = theme.value?.metaColor; }
    body.style.setProperty('--color-alpha', alpha);
    body.style.setProperty('--color-beta', beta);
    body.style.setProperty('--color-gamma', gamma);
    // box shadow
    body.style.setProperty('--shadow-beta', `0 25px 50px -12px ${hexToRgba(beta, 0.15)}`);
    body.style.setProperty('--ring-offset-shadow', `0 0 ${beta}`);
    body.style.setProperty('--ring-shadow', `0 0 ${beta}`);
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
