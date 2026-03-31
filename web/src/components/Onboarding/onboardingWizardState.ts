import type { StepId } from '~/components/Onboarding/stepRegistry.js';

export type OnboardingPoolMode = 'dedicated' | 'hybrid';

export type OnboardingBootMode = 'usb' | 'storage';

export interface OnboardingInternalBootSelection {
  poolName?: string;
  slotCount?: number;
  devices?: string[];
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

export const createEmptyOnboardingWizardDraft = (): OnboardingWizardDraft => ({});

export const createEmptyOnboardingWizardInternalBootState = (): OnboardingWizardInternalBootState => ({
  applyAttempted: false,
  applySucceeded: false,
});

export const cloneOnboardingWizardDraft = (draft: OnboardingWizardDraft): OnboardingWizardDraft => ({
  coreSettings: draft.coreSettings ? { ...draft.coreSettings } : undefined,
  plugins: draft.plugins
    ? {
        selectedIds: draft.plugins.selectedIds ? [...draft.plugins.selectedIds] : [],
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
                  devices: draft.internalBoot.selection.devices
                    ? [...draft.internalBoot.selection.devices]
                    : [],
                },
      }
    : undefined,
});
