import type { StepId } from '~/components/Onboarding/stepRegistry.js';

export type OnboardingPoolMode = 'dedicated' | 'hybrid';

export type OnboardingBootMode = 'usb' | 'storage';

export interface OnboardingInternalBootDevice {
  id: string;
  sizeBytes: number;
  deviceName: string;
}

export interface OnboardingInternalBootSelection {
  poolName?: string;
  slotCount?: number;
  devices?: OnboardingInternalBootDevice[];
  bootSizeMiB?: number;
  updateBios?: boolean;
  poolMode?: OnboardingPoolMode;
}

export interface OnboardingCoreSettingsDraft {
  serverName?: string;
  serverDescription?: string;
  timeZone?: string;
  theme?: string;
  language?: string;
  useSsh?: boolean;
}

export interface OnboardingPluginsDraft {
  selectedIds?: string[];
}

export interface OnboardingInternalBootDraft {
  bootMode?: OnboardingBootMode;
  skipped?: boolean;
  selection?: OnboardingInternalBootSelection | null;
}

export interface OnboardingWizardDraft {
  activationStepIncluded?: boolean;
  coreSettings?: OnboardingCoreSettingsDraft;
  plugins?: OnboardingPluginsDraft;
  internalBoot?: OnboardingInternalBootDraft;
}

export interface OnboardingWizardInternalBootState {
  applyAttempted: boolean;
  applySucceeded: boolean;
}

export interface OnboardingWizardState {
  currentStepId: StepId | null;
  visibleStepIds: StepId[];
  draft: OnboardingWizardDraft;
  internalBootState: OnboardingWizardInternalBootState;
}

export const ONBOARDING_RESUME_STEP_QUERY_KEY = 'onboardingResumeStep';

export const createEmptyOnboardingWizardDraft = (): OnboardingWizardDraft => ({});

export const createEmptyOnboardingWizardInternalBootState = (): OnboardingWizardInternalBootState => ({
  applyAttempted: false,
  applySucceeded: false,
});

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : '';
};

const normalizeBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

const normalizeStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;

const normalizePoolMode = (value: unknown): OnboardingPoolMode | undefined =>
  value === 'dedicated' || value === 'hybrid' ? value : undefined;

const normalizeBootMode = (value: unknown): OnboardingBootMode | undefined =>
  value === 'usb' || value === 'storage' ? value : undefined;

const normalizeInternalBootDevice = (value: unknown): OnboardingInternalBootDevice | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const id = normalizeString(candidate.id);
  const deviceName = normalizeString(candidate.deviceName);
  const parsedSizeBytes = Number(candidate.sizeBytes);

  if (!id || !deviceName || !Number.isFinite(parsedSizeBytes) || parsedSizeBytes <= 0) {
    return null;
  }

  return {
    id,
    sizeBytes: parsedSizeBytes,
    deviceName,
  };
};

const normalizeInternalBootDevices = (value: unknown): OnboardingInternalBootDevice[] | undefined =>
  Array.isArray(value)
    ? value
        .map((device) => normalizeInternalBootDevice(device))
        .filter((device): device is OnboardingInternalBootDevice => device !== null)
    : undefined;

const normalizeSlotCount = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && (parsed === 1 || parsed === 2) ? parsed : undefined;
};

const normalizeBootSizeMiB = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

const normalizeInternalBootSelection = (
  value: unknown
): OnboardingInternalBootSelection | null | undefined => {
  if (value === null) {
    return null;
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;

  return {
    poolName: normalizeString(candidate.poolName),
    slotCount: normalizeSlotCount(candidate.slotCount),
    devices: normalizeInternalBootDevices(candidate.devices),
    bootSizeMiB: normalizeBootSizeMiB(candidate.bootSizeMiB),
    updateBios: normalizeBoolean(candidate.updateBios),
    poolMode: normalizePoolMode(candidate.poolMode),
  };
};

export const normalizeOnboardingWizardDraft = (value: unknown): OnboardingWizardDraft => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const candidate = value as Record<string, unknown>;
  const activationStepIncluded = normalizeBoolean(candidate.activationStepIncluded);

  return {
    ...(activationStepIncluded === undefined ? {} : { activationStepIncluded }),
    coreSettings:
      candidate.coreSettings && typeof candidate.coreSettings === 'object'
        ? {
            serverName: normalizeString((candidate.coreSettings as Record<string, unknown>).serverName),
            serverDescription: normalizeString(
              (candidate.coreSettings as Record<string, unknown>).serverDescription
            ),
            timeZone: normalizeString((candidate.coreSettings as Record<string, unknown>).timeZone),
            theme: normalizeString((candidate.coreSettings as Record<string, unknown>).theme),
            language: normalizeString((candidate.coreSettings as Record<string, unknown>).language),
            useSsh: normalizeBoolean((candidate.coreSettings as Record<string, unknown>).useSsh),
          }
        : undefined,
    plugins:
      candidate.plugins && typeof candidate.plugins === 'object'
        ? {
            selectedIds: normalizeStringArray(
              (candidate.plugins as Record<string, unknown>).selectedIds
            ),
          }
        : undefined,
    internalBoot:
      candidate.internalBoot && typeof candidate.internalBoot === 'object'
        ? {
            bootMode: normalizeBootMode((candidate.internalBoot as Record<string, unknown>).bootMode),
            skipped: normalizeBoolean((candidate.internalBoot as Record<string, unknown>).skipped),
            selection:
              (candidate.internalBoot as Record<string, unknown>).selection === undefined
                ? undefined
                : normalizeInternalBootSelection(
                    (candidate.internalBoot as Record<string, unknown>).selection
                  ),
          }
        : undefined,
  };
};

export const cloneOnboardingWizardDraft = (draft: OnboardingWizardDraft): OnboardingWizardDraft => ({
  ...(draft.activationStepIncluded === undefined
    ? {}
    : { activationStepIncluded: draft.activationStepIncluded }),
  coreSettings: draft.coreSettings ? { ...draft.coreSettings } : undefined,
  plugins: draft.plugins
    ? {
        selectedIds:
          draft.plugins.selectedIds === undefined ? undefined : [...draft.plugins.selectedIds],
      }
    : undefined,
  internalBoot: draft.internalBoot
    ? {
        ...draft.internalBoot,
        selection:
          draft.internalBoot.selection === undefined
            ? undefined
            : draft.internalBoot.selection === null
              ? null
              : {
                  ...draft.internalBoot.selection,
                  devices:
                    draft.internalBoot.selection.devices === undefined
                      ? undefined
                      : draft.internalBoot.selection.devices.map((device) => ({ ...device })),
                },
      }
    : undefined,
});
