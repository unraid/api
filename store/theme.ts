import { defineStore, createPinia, setActivePinia } from "pinia";
import hexToRgba from 'hex-to-rgba';
import type { Theme } from "~/types/theme";
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useThemeStore = defineStore('theme', () => {
  // State
  const serverTheme = ref<Theme|undefined>();
  // Getters
  const darkMode = computed(() => (serverTheme.value?.name === 'black' || serverTheme.value?.name === 'azure') ?? false);
  // Actions
  const setTheme = (data: Theme) => {
    console.debug('[setTheme]');
    serverTheme.value = data;
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
    if (serverTheme.value?.textColor) alpha = serverTheme.value?.textColor;
    if (serverTheme.value?.bgColor) {
      beta = serverTheme.value?.bgColor;
      body.style.setProperty('--color-customgradient-start', hexToRgba(beta, 0));
      body.style.setProperty('--color-customgradient-end', hexToRgba(beta, 0.9));
    }
    if (serverTheme.value?.metaColor) gamma = serverTheme.value?.metaColor;
    body.style.setProperty('--color-alpha', alpha);
    body.style.setProperty('--color-beta', beta);
    body.style.setProperty('--color-gamma', gamma);
    // box shadow
    body.style.setProperty('--shadow-beta', `0 25px 50px -12px ${hexToRgba(beta, 0.15)}`);
    body.style.setProperty('--ring-offset-shadow', `0 0 ${beta}`);
    body.style.setProperty('--ring-shadow', `0 0 ${beta}`);
  };

  watch(serverTheme, () => {
    setCssVars();
  });

  return {
    setTheme,
  };
});
