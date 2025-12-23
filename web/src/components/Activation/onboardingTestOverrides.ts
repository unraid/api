import { computed, ref } from 'vue';

import type {
  ActivationCode,
  ActivationOnboarding,
  ActivationOnboardingStep,
  PublicPartnerInfo,
  RegistrationState,
} from '~/composables/gql/graphql';

import { ActivationOnboardingStepId } from '~/composables/gql/graphql';

export type ActivationOnboardingStepOverride = {
  id: ActivationOnboardingStepId;
  required?: boolean;
  completed?: boolean;
  introducedIn?: string;
};

export type ActivationOnboardingOverride = {
  currentVersion?: string | null;
  previousVersion?: string | null;
  isUpgrade?: boolean;
  steps?: ActivationOnboardingStepOverride[];
};

export type OnboardingTestOverrides = {
  activationOnboarding?: ActivationOnboardingOverride;
  activationCode?: ActivationCode | null;
  partnerInfo?: PublicPartnerInfo | null;
  regState?: RegistrationState | string;
  isInitialSetup?: boolean;
};

export const DEFAULT_ACTIVATION_STEPS: ActivationOnboardingStepOverride[] = [
  {
    id: ActivationOnboardingStepId.WELCOME,
    required: false,
    completed: false,
    introducedIn: '7.0.0',
  },
  {
    id: ActivationOnboardingStepId.TIMEZONE,
    required: true,
    completed: false,
    introducedIn: '7.0.0',
  },
  {
    id: ActivationOnboardingStepId.PLUGINS,
    required: false,
    completed: false,
    introducedIn: '7.0.0',
  },
  {
    id: ActivationOnboardingStepId.ACTIVATION,
    required: true,
    completed: false,
    introducedIn: '7.0.0',
  },
];

const OVERRIDE_STORAGE_KEY = 'unraid:onboarding:test-overrides';
const MODE_STORAGE_KEY = 'unraid:onboarding:test-mode';

const overridesRef = ref<OnboardingTestOverrides | null>(null);
const enabledRef = ref(false);
let initialized = false;

const isBrowser = () => typeof window !== 'undefined';

const isTestPage = () => {
  if (!isBrowser()) return false;
  return window.location?.pathname?.includes('/test-pages/') ?? false;
};

const safeParseOverrides = (value: string | null): OnboardingTestOverrides | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as OnboardingTestOverrides;
  } catch {
    return null;
  }
};

const readOverridesFromStorage = (): OnboardingTestOverrides | null => {
  if (!isBrowser()) return null;
  try {
    return safeParseOverrides(window.localStorage?.getItem(OVERRIDE_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
};

const readEnabledFromStorage = (): boolean | null => {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage?.getItem(MODE_STORAGE_KEY);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
  } catch {
    return null;
  }
  return null;
};

const resolveEnabled = (overrides: OnboardingTestOverrides | null): boolean => {
  if (!isBrowser()) return false;

  const params = new URLSearchParams(window.location.search);
  const queryFlag = params.get('onboardingTest');
  if (queryFlag === '1' || queryFlag === 'true') {
    return true;
  }

  if (!isTestPage()) {
    return false;
  }

  const stored = readEnabledFromStorage();
  if (stored != null) {
    return stored;
  }

  return Boolean(overrides);
};

const syncOverrides = () => {
  overridesRef.value = readOverridesFromStorage();
  enabledRef.value = resolveEnabled(overridesRef.value);
};

const handleStorageUpdate = (event: StorageEvent) => {
  if (event.key === OVERRIDE_STORAGE_KEY || event.key === MODE_STORAGE_KEY) {
    syncOverrides();
  }
};

const handleCustomUpdate = () => {
  syncOverrides();
};

const initialize = () => {
  if (initialized) return;
  initialized = true;
  syncOverrides();

  if (!isBrowser()) return;
  window.addEventListener('storage', handleStorageUpdate);
  window.addEventListener('unraid:onboarding-test:update', handleCustomUpdate as EventListener);
};

export const useOnboardingTestOverrides = () => {
  initialize();
  return {
    enabled: computed(() => enabledRef.value),
    overrides: overridesRef,
    setEnabled: (value: boolean) => {
      enabledRef.value = value;
      if (!isBrowser() || !isTestPage()) return;
      try {
        window.localStorage?.setItem(MODE_STORAGE_KEY, value ? 'true' : 'false');
      } catch {
        // ignore storage errors
      }
    },
    setOverrides: (value: OnboardingTestOverrides | null) => {
      overridesRef.value = value;
      if (isBrowser()) {
        try {
          if (value) {
            window.localStorage?.setItem(OVERRIDE_STORAGE_KEY, JSON.stringify(value));
          } else {
            window.localStorage?.removeItem(OVERRIDE_STORAGE_KEY);
          }
        } catch {
          // ignore storage errors
        }
        if (isTestPage()) {
          enabledRef.value = true;
          try {
            window.localStorage?.setItem(MODE_STORAGE_KEY, 'true');
          } catch {
            // ignore storage errors
          }
        }
        window.dispatchEvent(new CustomEvent('unraid:onboarding-test:update'));
      }
    },
    clearOverrides: () => {
      overridesRef.value = null;
      if (!isBrowser()) return;
      try {
        window.localStorage?.removeItem(OVERRIDE_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
      window.dispatchEvent(new CustomEvent('unraid:onboarding-test:update'));
    },
  };
};

export const hasOverrideKey = <Key extends keyof OnboardingTestOverrides>(
  overrides: OnboardingTestOverrides | null,
  key: Key
): boolean => {
  return Boolean(overrides && Object.prototype.hasOwnProperty.call(overrides, key));
};

export const isEnoKeyFile = (value: string | RegistrationState | null | undefined): boolean => {
  if (!value) return false;
  return String(value).startsWith('ENOKEYFILE');
};

const DEFAULT_STEP_LOOKUP = DEFAULT_ACTIVATION_STEPS.reduce<
  Record<string, ActivationOnboardingStepOverride>
>((acc, step) => {
  acc[step.id] = step;
  return acc;
}, {});

export const buildActivationOnboardingOverride = (
  overrides: OnboardingTestOverrides | null
): ActivationOnboarding | undefined => {
  const override = overrides?.activationOnboarding;
  if (!override) return undefined;

  const currentVersion = override.currentVersion ?? null;
  const previousVersion = override.previousVersion ?? null;
  const isUpgrade =
    typeof override.isUpgrade === 'boolean'
      ? override.isUpgrade
      : Boolean(currentVersion && previousVersion && currentVersion !== previousVersion);

  const stepsSource = override.steps ?? DEFAULT_ACTIVATION_STEPS;
  const steps: ActivationOnboardingStep[] = stepsSource.map((step) => {
    const defaults = DEFAULT_STEP_LOOKUP[step.id];
    return {
      __typename: 'ActivationOnboardingStep',
      id: step.id,
      required: step.required ?? defaults?.required ?? false,
      completed: step.completed ?? false,
      introducedIn: step.introducedIn ?? defaults?.introducedIn ?? null,
    };
  });

  return {
    __typename: 'ActivationOnboarding',
    currentVersion,
    previousVersion: isUpgrade ? previousVersion : null,
    isUpgrade,
    hasPendingSteps: steps.some((step) => !step.completed),
    steps,
  };
};
