import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import type { StepId } from '~/components/Onboarding/stepRegistry.js';

import { STEP_IDS } from '~/components/Onboarding/stepRegistry.js';

export interface OnboardingInternalBootSelection {
  poolName: string;
  slotCount: number;
  devices: string[];
  bootSizeMiB: number;
  updateBios: boolean;
}

export type OnboardingBootMode = 'usb' | 'storage';

const normalizePersistedBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }

  return fallback;
};

const normalizePersistedPlugins = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (value instanceof Set) {
    return Array.from(value).filter((item): item is string => typeof item === 'string');
  }

  return [];
};

const normalizePersistedInternalBootSelection = (
  value: unknown
): OnboardingInternalBootSelection | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as {
    poolName?: unknown;
    slotCount?: unknown;
    devices?: unknown;
    bootSizeMiB?: unknown;
    updateBios?: unknown;
  };

  const poolName = typeof candidate.poolName === 'string' ? candidate.poolName : '';
  const parsedSlotCount = Number(candidate.slotCount);
  const slotCount = Number.isFinite(parsedSlotCount) ? Math.max(1, Math.min(2, parsedSlotCount)) : 1;
  const devices = Array.isArray(candidate.devices)
    ? candidate.devices.filter((item): item is string => typeof item === 'string')
    : [];
  const parsedBootSize = Number(candidate.bootSizeMiB);
  const bootSizeMiB = Number.isFinite(parsedBootSize) && parsedBootSize > 0 ? parsedBootSize : 16384;

  return {
    poolName,
    slotCount,
    devices,
    bootSizeMiB,
    updateBios: normalizePersistedBoolean(candidate.updateBios, false),
  };
};

const normalizePersistedBootMode = (
  value: unknown,
  internalBootSelection: OnboardingInternalBootSelection | null
): OnboardingBootMode => {
  if (value === 'usb' || value === 'storage') {
    return value;
  }
  return internalBootSelection ? 'storage' : 'usb';
};

const normalizePersistedStepId = (value: unknown): StepId | null => {
  if (typeof value !== 'string') {
    return null;
  }

  return STEP_IDS.includes(value as StepId) ? (value as StepId) : null;
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
    const coreSettingsInitialized = ref(false);

    // Plugins
    const selectedPlugins = ref<Set<string>>(new Set());
    const pluginSelectionInitialized = ref(false);

    // Internal boot
    const internalBootSelection = ref<OnboardingInternalBootSelection | null>(null);
    const bootMode = ref<OnboardingBootMode>('usb');
    const internalBootInitialized = ref(false);
    const internalBootSkipped = ref(false);
    const internalBootApplySucceeded = ref(false);

    // Navigation
    const currentStepIndex = ref(0);
    const currentStepId = ref<StepId | null>(null);
    const hasResumableDraft = computed(
      () =>
        currentStepIndex.value > 0 ||
        currentStepId.value !== null ||
        coreSettingsInitialized.value ||
        pluginSelectionInitialized.value ||
        internalBootInitialized.value ||
        internalBootApplySucceeded.value
    );

    function resetDraft() {
      serverName.value = '';
      serverDescription.value = '';
      selectedTimeZone.value = '';
      selectedTheme.value = '';
      selectedLanguage.value = '';
      useSsh.value = false;
      coreSettingsInitialized.value = false;

      selectedPlugins.value = new Set();
      pluginSelectionInitialized.value = false;

      internalBootSelection.value = null;
      bootMode.value = 'usb';
      internalBootInitialized.value = false;
      internalBootSkipped.value = false;
      internalBootApplySucceeded.value = false;

      currentStepIndex.value = 0;
      currentStepId.value = null;
    }

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
      coreSettingsInitialized.value = true;
    }

    function setPlugins(plugins: Set<string>) {
      selectedPlugins.value = new Set(plugins);
      pluginSelectionInitialized.value = true;
    }

    function setInternalBootSelection(selection: OnboardingInternalBootSelection) {
      internalBootSelection.value = {
        poolName: selection.poolName,
        slotCount: selection.slotCount,
        devices: [...selection.devices],
        bootSizeMiB: selection.bootSizeMiB,
        updateBios: selection.updateBios,
      };
      bootMode.value = 'storage';
      internalBootInitialized.value = true;
      internalBootSkipped.value = false;
      internalBootApplySucceeded.value = false;
    }

    function skipInternalBoot() {
      internalBootSelection.value = null;
      bootMode.value = 'usb';
      internalBootInitialized.value = true;
      internalBootSkipped.value = true;
      internalBootApplySucceeded.value = false;
    }

    function setBootMode(mode: OnboardingBootMode) {
      bootMode.value = mode;
      internalBootInitialized.value = true;
      internalBootSkipped.value = false;
      if (mode === 'usb') {
        internalBootSelection.value = null;
        internalBootApplySucceeded.value = false;
      }
    }

    function setInternalBootApplySucceeded(value: boolean) {
      internalBootApplySucceeded.value = value;
    }

    function setCurrentStep(stepId: StepId, index: number) {
      currentStepId.value = stepId;
      currentStepIndex.value = index;
    }

    function setStepIndex(index: number) {
      const stepId = STEP_IDS[index] ?? null;
      currentStepIndex.value = index;
      currentStepId.value = stepId;
    }

    return {
      serverName,
      serverDescription,
      selectedTimeZone,
      selectedTheme,
      selectedLanguage,
      useSsh,
      coreSettingsInitialized,
      selectedPlugins,
      pluginSelectionInitialized,
      internalBootSelection,
      bootMode,
      internalBootInitialized,
      internalBootSkipped,
      internalBootApplySucceeded,
      currentStepIndex,
      currentStepId,
      hasResumableDraft,
      resetDraft,
      setCoreSettings,
      setPlugins,
      setInternalBootSelection,
      skipInternalBoot,
      setBootMode,
      setInternalBootApplySucceeded,
      setCurrentStep,
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
          const normalizedInternalBootSelection = normalizePersistedInternalBootSelection(
            parsed.internalBootSelection
          );
          const normalizedBootMode = normalizePersistedBootMode(
            parsed.bootMode,
            normalizedInternalBootSelection
          );
          const normalizedCurrentStepId = normalizePersistedStepId(parsed.currentStepId);
          const hasLegacyCoreDraft =
            (typeof parsed.serverName === 'string' && parsed.serverName.length > 0) ||
            (typeof parsed.serverDescription === 'string' && parsed.serverDescription.length > 0) ||
            (typeof parsed.selectedTimeZone === 'string' && parsed.selectedTimeZone.length > 0) ||
            (typeof parsed.selectedTheme === 'string' && parsed.selectedTheme.length > 0) ||
            (typeof parsed.selectedLanguage === 'string' && parsed.selectedLanguage.length > 0) ||
            parsed.useSsh === true;
          const hadLegacyPluginShape =
            parsed.selectedPlugins !== undefined &&
            parsed.selectedPlugins !== null &&
            !Array.isArray(parsed.selectedPlugins);
          return {
            ...parsed,
            selectedPlugins: new Set(normalizePersistedPlugins(parsed.selectedPlugins)),
            internalBootSelection: normalizedInternalBootSelection,
            bootMode: normalizedBootMode,
            internalBootInitialized: normalizePersistedBoolean(parsed.internalBootInitialized, false),
            internalBootSkipped:
              parsed.internalBootSkipped !== undefined
                ? normalizePersistedBoolean(parsed.internalBootSkipped, normalizedBootMode === 'usb')
                : normalizedBootMode === 'usb',
            internalBootApplySucceeded: normalizePersistedBoolean(
              parsed.internalBootApplySucceeded,
              false
            ),
            currentStepId: normalizedCurrentStepId,
            coreSettingsInitialized:
              hasLegacyCoreDraft || normalizePersistedBoolean(parsed.coreSettingsInitialized, false),
            pluginSelectionInitialized: hadLegacyPluginShape
              ? false
              : normalizePersistedBoolean(parsed.pluginSelectionInitialized, false),
          };
        },
      },
    },
  }
);
