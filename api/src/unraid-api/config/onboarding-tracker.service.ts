import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import path from 'path';

import { writeFile } from 'atomically';

import type { TrackerState } from '@app/unraid-api/config/onboarding-tracker.model.js';
import { PATHS_CONFIG_MODULES } from '@app/environment.js';
import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';

const TRACKER_FILE_NAME = 'onboarding-tracker.json';
const CONFIG_PREFIX = 'onboardingTracker';
const DEFAULT_OS_VERSION_FILE_PATH = '/etc/unraid-version';
const WRITE_RETRY_ATTEMPTS = 3;
const WRITE_RETRY_DELAY_MS = 100;

type PublicTrackerState = { completed: boolean; completedAtVersion?: string };

export type OnboardingTrackerStateResult =
    | { kind: 'ok'; state: PublicTrackerState }
    | { kind: 'missing'; state: PublicTrackerState }
    | { kind: 'error'; error: Error };

/**
 * Simplified onboarding tracker service.
 * Tracks whether onboarding has been completed and at which version.
 */
@Injectable()
export class OnboardingTrackerService implements OnApplicationBootstrap {
    private readonly logger = new Logger(OnboardingTrackerService.name);
    private readonly trackerPath = path.join(PATHS_CONFIG_MODULES, TRACKER_FILE_NAME);
    private state: TrackerState = {};
    private hasPersistedState = false;
    private currentVersion?: string;
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
        if (previousState.kind !== 'error') {
            this.state = previousState.state;
            this.hasPersistedState = previousState.kind === 'ok';
        } else {
            this.state = {};
            this.hasPersistedState = false;
        }
        this.syncConfig();
    }

    private getCachedState(): PublicTrackerState {
        // Check for override first (for testing)
        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.onboarding !== undefined) {
            return {
                completed: overrideState.onboarding.completed ?? false,
                completedAtVersion: overrideState.onboarding.completedAtVersion ?? undefined,
            };
        }

        return {
            completed: this.state.completed ?? false,
            completedAtVersion: this.state.completedAtVersion,
        };
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

    async getStateResult(): Promise<OnboardingTrackerStateResult> {
        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.onboarding !== undefined) {
            return {
                kind: 'ok',
                state: this.getCachedState(),
            };
        }

        const trackerStateResult = await this.readTrackerStateResult();
        if (trackerStateResult.kind === 'ok') {
            this.state = trackerStateResult.state;
            this.hasPersistedState = true;
            return trackerStateResult;
        }

        if (trackerStateResult.kind === 'missing') {
            if (this.hasPersistedState) {
                this.logger.debug(
                    `Onboarding tracker state temporarily disappeared at ${this.trackerPath}; using cached state.`
                );
                return {
                    kind: 'ok',
                    state: this.getCachedState(),
                };
            }

            this.state = trackerStateResult.state;
            this.hasPersistedState = false;
            return trackerStateResult;
        }

        if (this.hasPersistedState) {
            this.logger.debug(
                `Onboarding tracker state could not be refreshed from ${this.trackerPath}; using cached state.`
            );
            return {
                kind: 'ok',
                state: this.getCachedState(),
            };
        }

        return trackerStateResult;
    }

    /**
     * Mark onboarding as completed for the current OS version.
     */
    async markCompleted(): Promise<{ completed: boolean; completedAtVersion?: string }> {
        // Check for override first
        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.onboarding !== undefined) {
            const updatedOverride = {
                ...overrideState,
                onboarding: {
                    ...overrideState.onboarding,
                    completed: true,
                    completedAtVersion:
                        this.currentVersion ?? overrideState.onboarding.completedAtVersion,
                },
            };
            this.onboardingOverrides.setState(updatedOverride);
            return this.getCachedState();
        }

        const updatedState: TrackerState = {
            completed: true,
            completedAtVersion: this.currentVersion,
        };

        await this.writeTrackerState(updatedState);
        this.syncConfig();

        return this.getCachedState();
    }

    /**
     * Reset onboarding state (for testing).
     */
    async reset(): Promise<{ completed: boolean; completedAtVersion?: string }> {
        // Check for override first
        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.onboarding !== undefined) {
            const updatedOverride = {
                ...overrideState,
                onboarding: {
                    ...overrideState.onboarding,
                    completed: false,
                    completedAtVersion: undefined,
                },
            };
            this.onboardingOverrides.setState(updatedOverride);
            return this.getCachedState();
        }

        const updatedState: TrackerState = {
            completed: false,
            completedAtVersion: undefined,
        };

        await this.writeTrackerState(updatedState);
        this.syncConfig();

        return this.getCachedState();
    }

    private syncConfig() {
        this.configService.set(`${CONFIG_PREFIX}.completed`, this.state.completed);
        this.configService.set(`${CONFIG_PREFIX}.completedAtVersion`, this.state.completedAtVersion);
        this.configService.set(`${CONFIG_PREFIX}.currentVersion`, this.currentVersion);
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
                },
            };
        } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                this.logger.debug(`Onboarding tracker state does not exist yet at ${this.trackerPath}.`);
                return {
                    kind: 'missing',
                    state: {
                        completed: false,
                        completedAtVersion: undefined,
                    },
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
                this.hasPersistedState = true;
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
