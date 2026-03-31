export const ONBOARDING_STEP_IDS = [
    'OVERVIEW',
    'CONFIGURE_SETTINGS',
    'CONFIGURE_BOOT',
    'ADD_PLUGINS',
    'ACTIVATE_LICENSE',
    'SUMMARY',
    'NEXT_STEPS',
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

export type OnboardingPoolMode = 'dedicated' | 'hybrid';

export type OnboardingBootMode = 'usb' | 'storage';

export type OnboardingInternalBootDevice = {
    id: string;
    sizeBytes: number;
    deviceName: string;
};

export type OnboardingInternalBootSelection = {
    poolName?: string;
    slotCount?: number;
    devices?: OnboardingInternalBootDevice[];
    bootSizeMiB?: number;
    updateBios?: boolean;
    poolMode?: OnboardingPoolMode;
};

export type OnboardingCoreSettingsDraft = {
    serverName?: string;
    serverDescription?: string;
    timeZone?: string;
    theme?: string;
    language?: string;
    useSsh?: boolean;
};

export type OnboardingPluginsDraft = {
    selectedIds?: string[];
};

export type OnboardingInternalBootDraft = {
    bootMode?: OnboardingBootMode;
    skipped?: boolean;
    selection?: OnboardingInternalBootSelection | null;
};

export type OnboardingDraft = {
    coreSettings?: OnboardingCoreSettingsDraft;
    plugins?: OnboardingPluginsDraft;
    internalBoot?: OnboardingInternalBootDraft;
};

export type OnboardingNavigationState = {
    currentStepId?: OnboardingStepId;
};

export type OnboardingInternalBootState = {
    applyAttempted?: boolean;
    applySucceeded?: boolean;
};

/**
 * Durable onboarding tracker state.
 * Tracks onboarding completion plus the server-owned wizard draft.
 */
export type TrackerState = {
    /** Whether the onboarding flow has been completed */
    completed?: boolean;
    /** The OS version when onboarding was completed (for future upgrade detection) */
    completedAtVersion?: string;
    /** Whether onboarding has been explicitly forced open */
    forceOpen?: boolean;
    /** Durable server-owned wizard draft */
    draft?: OnboardingDraft;
    /** Durable navigation state for onboarding resume */
    navigation?: OnboardingNavigationState;
    /** Operational internal boot state that is not user-entered draft data */
    internalBootState?: OnboardingInternalBootState;
};
