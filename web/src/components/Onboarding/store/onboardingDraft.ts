import { ref } from 'vue';
import { defineStore } from 'pinia';

const normalizePersistedPlugins = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (value instanceof Set) {
    return Array.from(value).filter((item): item is string => typeof item === 'string');
  }

  return [];
};

export const useOnboardingDraftStore = defineStore(
  'onboardingDraft',
  () => {
    // Core Settings
    const serverName = ref('');
    const serverDescription = ref('');
    const selectedTimeZone = ref('');
    const selectedTheme = ref('');
    const selectedLanguage = ref('');
    const useSsh = ref(false);

    // Plugins
    const selectedPlugins = ref<Set<string>>(new Set());
    const pluginSelectionInitialized = ref(false);

    // Navigation
    const currentStepIndex = ref(0);

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
      pluginSelectionInitialized.value = true;
    }

    function setStepIndex(index: number) {
      currentStepIndex.value = index;
    }

    return {
      serverName,
      serverDescription,
      selectedTimeZone,
      selectedTheme,
      selectedLanguage,
      useSsh,
      selectedPlugins,
      pluginSelectionInitialized,
      currentStepIndex,
      setCoreSettings,
      setPlugins,
      setStepIndex,
    };
  },
  {
    persist: {
      serializer: {
        serialize: (value) => {
          const state = value as Record<string, unknown>;
          const selectedPlugins = normalizePersistedPlugins(state.selectedPlugins);
          return JSON.stringify({ ...state, selectedPlugins });
        },
        deserialize: (value) => {
          const parsed = JSON.parse(value) as Record<string, unknown>;
          const hadLegacyPluginShape =
            parsed.selectedPlugins !== undefined &&
            parsed.selectedPlugins !== null &&
            !Array.isArray(parsed.selectedPlugins);
          return {
            ...parsed,
            selectedPlugins: new Set(normalizePersistedPlugins(parsed.selectedPlugins)),
            pluginSelectionInitialized: hadLegacyPluginShape
              ? false
              : Boolean(parsed.pluginSelectionInitialized),
          };
        },
      },
    },
  }
);
