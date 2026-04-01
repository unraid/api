import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import path from 'path';

import { writeFile } from 'atomically';

import type {
    OnboardingBootMode,
    OnboardingCoreSettingsDraft,
    OnboardingDraft,
    OnboardingInternalBootDevice,
    OnboardingInternalBootDraft,
    OnboardingInternalBootSelection,
    OnboardingInternalBootState,
    OnboardingNavigationState,
    OnboardingPluginsDraft,
    OnboardingPoolMode,
    OnboardingStepId,
    TrackerState,
} from '@app/unraid-api/config/onboarding-tracker.model.js';
import { PATHS_CONFIG_MODULES } from '@app/environment.js';
import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import { ONBOARDING_STEP_IDS } from '@app/unraid-api/config/onboarding-tracker.model.js';

const TRACKER_FILE_NAME = 'onboarding-tracker.json';
const CONFIG_PREFIX = 'onboardingTracker';
const DEFAULT_OS_VERSION_FILE_PATH = '/etc/unraid-version';
const WRITE_RETRY_ATTEMPTS = 3;
const WRITE_RETRY_DELAY_MS = 100;

export type PublicTrackerState = {
    completed: boolean;
    completedAtVersion?: string;
    forceOpen: boolean;
    draft: OnboardingDraft;
    navigation: OnboardingNavigationState;
    internalBootState: OnboardingInternalBootState;
};

export type OnboardingTrackerStateResult =
    | { kind: 'ok'; state: PublicTrackerState }
    | { kind: 'missing'; state: PublicTrackerState }
    | { kind: 'error'; error: Error };

type SaveOnboardingDraftInput = {
    draft?: OnboardingDraft;
    navigation?: OnboardingNavigationState;
    internalBootState?: OnboardingInternalBootState;
};

const normalizeBoolean = (value: unknown, fallback = false): boolean => {
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

    return fallback;
};

const normalizeString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : '';
};

const normalizeStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
};

const normalizeBootDevice = (value: unknown): OnboardingInternalBootDevice | null => {
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

const normalizeBootDeviceArray = (value: unknown): OnboardingInternalBootDevice[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => normalizeBootDevice(item))
        .filter((item): item is OnboardingInternalBootDevice => item !== null);
};

const normalizeStepId = (value: unknown): OnboardingStepId | undefined => {
    if (typeof value !== 'string') {
        return undefined;
    }

    return ONBOARDING_STEP_IDS.includes(value as OnboardingStepId)
        ? (value as OnboardingStepId)
        : undefined;
};

const normalizePoolMode = (value: unknown): OnboardingPoolMode | undefined => {
    if (value === 'dedicated' || value === 'hybrid') {
        return value;
    }

    return undefined;
};

const normalizeBootMode = (value: unknown): OnboardingBootMode | undefined => {
    if (value === 'usb' || value === 'storage') {
        return value;
    }

    return undefined;
};

const normalizeInternalBootSelection = (value: unknown): OnboardingInternalBootSelection | null => {
    if (value === null) {
        return null;
    }

    if (!value || typeof value !== 'object') {
        return null;
    }

    const candidate = value as Record<string, unknown>;
    const parsedSlotCount = Number(candidate.slotCount);
    const parsedBootSize = Number(candidate.bootSizeMiB);

    return {
        poolName: normalizeString(candidate.poolName),
        slotCount: Number.isFinite(parsedSlotCount)
            ? Math.max(1, Math.min(2, parsedSlotCount))
            : undefined,
        devices: normalizeBootDeviceArray(candidate.devices),
        bootSizeMiB: Number.isFinite(parsedBootSize) ? Math.max(0, parsedBootSize) : undefined,
        updateBios: normalizeBoolean(candidate.updateBios, false),
        poolMode: normalizePoolMode(candidate.poolMode),
    };
};

const normalizeCoreSettingsDraft = (value: unknown): OnboardingCoreSettingsDraft | undefined => {
    if (!value || typeof value !== 'object') {
        return undefined;
    }

    const candidate = value as Record<string, unknown>;

    return {
        serverName: normalizeString(candidate.serverName),
        serverDescription: normalizeString(candidate.serverDescription),
        timeZone: normalizeString(candidate.timeZone),
        theme: normalizeString(candidate.theme),
        language: normalizeString(candidate.language),
        useSsh: typeof candidate.useSsh === 'boolean' ? candidate.useSsh : undefined,
    };
};

const normalizePluginsDraft = (value: unknown): OnboardingPluginsDraft | undefined => {
    if (!value || typeof value !== 'object') {
        return undefined;
    }

    const candidate = value as Record<string, unknown>;

    return {
        selectedIds: normalizeStringArray(candidate.selectedIds),
    };
};

const normalizeInternalBootDraft = (value: unknown): OnboardingInternalBootDraft | undefined => {
    if (!value || typeof value !== 'object') {
        return undefined;
    }

    const candidate = value as Record<string, unknown>;

    return {
        bootMode: normalizeBootMode(candidate.bootMode),
        skipped: typeof candidate.skipped === 'boolean' ? candidate.skipped : undefined,
        selection:
            candidate.selection === undefined
                ? undefined
                : normalizeInternalBootSelection(candidate.selection),
    };
};

const normalizeDraft = (value: unknown): OnboardingDraft => {
    if (!value || typeof value !== 'object') {
        return {};
    }

    const candidate = value as Record<string, unknown>;

    return {
        coreSettings: normalizeCoreSettingsDraft(candidate.coreSettings),
        plugins: normalizePluginsDraft(candidate.plugins),
        internalBoot: normalizeInternalBootDraft(candidate.internalBoot),
    };
};

const normalizeNavigation = (value: unknown): OnboardingNavigationState => {
    if (!value || typeof value !== 'object') {
        return {};
    }

    const candidate = value as Record<string, unknown>;

    return {
        currentStepId: normalizeStepId(candidate.currentStepId),
    };
};

const normalizeInternalBootState = (value: unknown): OnboardingInternalBootState => {
    if (!value || typeof value !== 'object') {
        return {
            applyAttempted: false,
            applySucceeded: false,
        };
    }

    const candidate = value as Record<string, unknown>;

    return {
        applyAttempted: normalizeBoolean(candidate.applyAttempted, false),
        applySucceeded: normalizeBoolean(candidate.applySucceeded, false),
    };
};

const createEmptyPublicState = (): PublicTrackerState => ({
    completed: false,
    completedAtVersion: undefined,
    forceOpen: false,
    draft: {},
    navigation: {},
    internalBootState: {
        applyAttempted: false,
        applySucceeded: false,
    },
});

/**
 * Simplified onboarding tracker service.
 * Tracks whether onboarding has been completed and at which version.
 */
@Injectable()
export class OnboardingTrackerService implements OnApplicationBootstrap {
    private readonly logger = new Logger(OnboardingTrackerService.name);
    private readonly trackerPath = path.join(PATHS_CONFIG_MODULES, TRACKER_FILE_NAME);
    private state: TrackerState = {};
    private currentVersion?: string;
    private bypassActive = false;
    private readonly versionFilePath: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly onboardingOverrides: OnboardingOverrideService
    ) {
        const unraidDataDir = this.configService.get<string>('PATHS_UNRAID_DATA');
        this.versionFilePath = unraidDataDir
            ? path.join(unraidDataDir, 'unraid-version')
            : DEFAULT_OS_VERSION_FILE_PATH;
    }

    async onApplicationBootstrap() {
        this.currentVersion = await this.readCurrentVersion();
        const previousState = await this.readTrackerStateResult();
        this.state = previousState.kind === 'error' ? {} : previousState.state;
        this.syncConfig();
    }

    private getCachedState(): PublicTrackerState {
        const baseState = {
            ...createEmptyPublicState(),
            completed: this.state.completed ?? false,
            completedAtVersion: this.state.completedAtVersion,
            forceOpen: this.state.forceOpen ?? false,
            draft: normalizeDraft(this.state.draft),
            navigation: normalizeNavigation(this.state.navigation),
            internalBootState: normalizeInternalBootState(this.state.internalBootState),
        };

        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.onboarding !== undefined) {
            return {
                ...baseState,
                completed: overrideState.onboarding.completed ?? false,
                completedAtVersion: overrideState.onboarding.completedAtVersion ?? undefined,
                forceOpen: overrideState.onboarding.forceOpen ?? false,
            };
        }

        return baseState;
    }

    /**
     * Check if onboarding is completed.
     */
    async isCompleted(): Promise<boolean> {
        const stateResult = await this.getStateResult();
        if (stateResult.kind === 'error') {
            throw stateResult.error;
        }

        return stateResult.state.completed;
    }

    /**
     * Get the version at which onboarding was completed.
     */
    async getCompletedAtVersion(): Promise<string | undefined> {
        const stateResult = await this.getStateResult();
        if (stateResult.kind === 'error') {
            throw stateResult.error;
        }

        return stateResult.state.completedAtVersion;
    }

    /**
     * Get the current OS version.
     */
    getCurrentVersion(): string | undefined {
        return this.currentVersion;
    }

    isBypassed(): boolean {
        return this.bypassActive;
    }

    async getStateResult(): Promise<OnboardingTrackerStateResult> {
        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.onboarding !== undefined) {
            return {
                kind: 'ok',
                state: this.getCachedState(),
            };
        }

        const trackerStateResult = await this.readTrackerStateResult();
        if (trackerStateResult.kind !== 'error') {
            this.state = trackerStateResult.state;
        }

        return trackerStateResult;
    }

    /**
     * Mark onboarding as completed for the current OS version.
     */
    async markCompleted(): Promise<{ completed: boolean; completedAtVersion?: string }> {
        this.bypassActive = false;
        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.onboarding !== undefined) {
            const updatedOverride = {
                ...overrideState,
                onboarding: {
                    ...overrideState.onboarding,
                    completed: true,
                    completedAtVersion:
                        this.currentVersion ?? overrideState.onboarding.completedAtVersion,
                    forceOpen: false,
                },
            };
            this.onboardingOverrides.setState(updatedOverride);
            return this.getCachedState();
        }

        const updatedState: TrackerState = {
            completed: true,
            completedAtVersion: this.currentVersion,
            forceOpen: false,
            draft: {},
            navigation: {},
            internalBootState: {
                applyAttempted: false,
                applySucceeded: false,
            },
        };

        await this.writeTrackerState(updatedState);
        this.syncConfig();

        return this.getCachedState();
    }

    /**
     * Reset onboarding state (for testing).
     */
    async reset(): Promise<{ completed: boolean; completedAtVersion?: string }> {
        this.bypassActive = false;
        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.onboarding !== undefined) {
            const updatedOverride = {
                ...overrideState,
                onboarding: {
                    ...overrideState.onboarding,
                    completed: false,
                    completedAtVersion: undefined,
                    forceOpen: false,
                },
            };
            this.onboardingOverrides.setState(updatedOverride);
            return this.getCachedState();
        }

        const updatedState: TrackerState = {
            completed: false,
            completedAtVersion: undefined,
            forceOpen: false,
            draft: {},
            navigation: {},
            internalBootState: {
                applyAttempted: false,
                applySucceeded: false,
            },
        };

        await this.writeTrackerState(updatedState);
        this.syncConfig();

        return this.getCachedState();
    }

    private syncConfig() {
        this.configService.set(`${CONFIG_PREFIX}.completed`, this.state.completed);
        this.configService.set(`${CONFIG_PREFIX}.completedAtVersion`, this.state.completedAtVersion);
        this.configService.set(`${CONFIG_PREFIX}.forceOpen`, this.state.forceOpen);
        this.configService.set(`${CONFIG_PREFIX}.currentVersion`, this.currentVersion);
    }

    async setForceOpen(
        forceOpen: boolean
    ): Promise<{ completed: boolean; completedAtVersion?: string; forceOpen: boolean }> {
        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.onboarding !== undefined) {
            const updatedOverride = {
                ...overrideState,
                onboarding: {
                    ...overrideState.onboarding,
                    forceOpen,
                },
            };
            this.onboardingOverrides.setState(updatedOverride);
            return this.getCachedState();
        }

        const currentStateResult = await this.getStateResult();
        if (currentStateResult.kind === 'error') {
            throw currentStateResult.error;
        }

        const updatedState: TrackerState = {
            completed: currentStateResult.state.completed,
            completedAtVersion: currentStateResult.state.completedAtVersion,
            forceOpen,
            draft: currentStateResult.state.draft,
            navigation: currentStateResult.state.navigation,
            internalBootState: currentStateResult.state.internalBootState,
        };

        await this.writeTrackerState(updatedState);
        this.syncConfig();

        return this.getCachedState();
    }

    setBypassActive(active: boolean): void {
        this.bypassActive = active;
    }

    async clearWizardState(): Promise<PublicTrackerState> {
        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.onboarding !== undefined) {
            this.state = {
                ...this.state,
                draft: {},
                navigation: {},
                internalBootState: {
                    applyAttempted: false,
                    applySucceeded: false,
                },
            };

            return this.getCachedState();
        }

        const currentStateResult = await this.getStateResult();
        if (currentStateResult.kind === 'error') {
            throw currentStateResult.error;
        }

        const currentState = currentStateResult.state;
        const updatedState: TrackerState = {
            completed: currentState.completed,
            completedAtVersion: currentState.completedAtVersion,
            forceOpen: currentState.forceOpen,
            draft: {},
            navigation: {},
            internalBootState: {
                applyAttempted: false,
                applySucceeded: false,
            },
        };

        await this.writeTrackerState(updatedState);
        this.syncConfig();

        return this.getCachedState();
    }

    async saveDraft(input: SaveOnboardingDraftInput): Promise<PublicTrackerState> {
        const currentStateResult = await this.getStateResult();
        if (currentStateResult.kind === 'error') {
            throw currentStateResult.error;
        }

        const currentState = currentStateResult.state;
        const nextDraft = normalizeDraft({
            ...currentState.draft,
            ...(input.draft ?? {}),
        });

        const updatedState: TrackerState = {
            completed: currentState.completed,
            completedAtVersion: currentState.completedAtVersion,
            forceOpen: currentState.forceOpen,
            draft: nextDraft,
            navigation: normalizeNavigation(
                input.navigation
                    ? {
                          ...currentState.navigation,
                          ...input.navigation,
                      }
                    : currentState.navigation
            ),
            internalBootState: normalizeInternalBootState(
                input.internalBootState
                    ? {
                          ...currentState.internalBootState,
                          ...input.internalBootState,
                      }
                    : currentState.internalBootState
            ),
        };

        await this.writeTrackerState(updatedState);
        this.syncConfig();

        return this.getCachedState();
    }

    private async readCurrentVersion(): Promise<string | undefined> {
        try {
            const contents = await readFile(this.versionFilePath, 'utf8');
            const match = contents.match(/^\s*version\s*=\s*"([^"]+)"\s*$/m);
            return match?.[1]?.trim() || undefined;
        } catch (error) {
            this.logger.debug(
                `Failed to read current OS version from ${this.versionFilePath}: ${error}`
            );
            return undefined;
        }
    }

    private async readTrackerStateResult(): Promise<OnboardingTrackerStateResult> {
        try {
            const content = await readFile(this.trackerPath, 'utf8');
            const state = JSON.parse(content) as TrackerState;
            return {
                kind: 'ok',
                state: {
                    completed: state.completed ?? false,
                    completedAtVersion: state.completedAtVersion,
                    forceOpen: state.forceOpen ?? false,
                    draft: normalizeDraft(state.draft),
                    navigation: normalizeNavigation(state.navigation),
                    internalBootState: normalizeInternalBootState(state.internalBootState),
                },
            };
        } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                this.logger.debug(`Onboarding tracker state does not exist yet at ${this.trackerPath}.`);
                return {
                    kind: 'missing',
                    state: createEmptyPublicState(),
                };
            }

            this.logger.debug(
                `Unable to read onboarding tracker state at ${this.trackerPath}: ${error}`
            );
            return {
                kind: 'error',
                error:
                    error instanceof Error
                        ? error
                        : new Error('Unable to read onboarding tracker state'),
            };
        }
    }

    private async writeTrackerState(state: TrackerState): Promise<void> {
        let lastError: unknown = null;

        for (let attempt = 1; attempt <= WRITE_RETRY_ATTEMPTS; attempt += 1) {
            try {
                await writeFile(this.trackerPath, JSON.stringify(state, null, 2), { mode: 0o644 });
                this.state = state;
                return;
            } catch (error) {
                lastError = error;
                this.logger.error(
                    `Failed to persist onboarding tracker state (attempt ${attempt}/${WRITE_RETRY_ATTEMPTS}): ${error}`
                );
                if (attempt < WRITE_RETRY_ATTEMPTS) {
                    await new Promise((resolve) => setTimeout(resolve, WRITE_RETRY_DELAY_MS));
                }
            }
        }

        throw lastError instanceof Error
            ? lastError
            : new Error('Failed to persist onboarding tracker state');
    }
}
