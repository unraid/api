import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useOnboardingDraftStore = defineStore('onboardingDraft', () => {
  // Core Settings
  const serverName = ref('');
  const serverDescription = ref('');
  const selectedTimeZone = ref('');
  const selectedTheme = ref('');
  const selectedLanguage = ref('');
  const useSsh = ref(false);

  // Plugins
  const selectedPlugins = ref<Set<string>>(new Set());

  // Actions
  function setCoreSettings(settings: {
    serverName: string;
    serverDescription: string;
    timeZone: string;
    theme: string;
    language: string;
    useSsh: boolean;
  }) {
    serverName.value = settings.serverName;
    serverDescription.value = settings.serverDescription;
    selectedTimeZone.value = settings.timeZone;
    selectedTheme.value = settings.theme;
    selectedLanguage.value = settings.language;
    useSsh.value = settings.useSsh;
  }

  function setPlugins(plugins: Set<string>) {
    selectedPlugins.value = new Set(plugins);
  }

  return {
    serverName,
    serverDescription,
    selectedTimeZone,
    selectedTheme,
    selectedLanguage,
    useSsh,
    selectedPlugins,
    setCoreSettings,
    setPlugins,
  };
});
