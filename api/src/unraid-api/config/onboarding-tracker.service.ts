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
        const previousState = await this.readTrackerState();
        this.state = previousState ?? {};
        this.syncConfig();
    }

    /**
     * Get the current onboarding state.
     */
    getState(): { completed: boolean; completedAtVersion?: string } {
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
    isCompleted(): boolean {
        return this.getState().completed;
    }

    /**
     * Get the version at which onboarding was completed.
     */
    getCompletedAtVersion(): string | undefined {
        return this.getState().completedAtVersion;
    }

    /**
     * Get the current OS version.
     */
    getCurrentVersion(): string | undefined {
        return this.currentVersion;
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
            return this.getState();
        }

        const updatedState: TrackerState = {
            completed: true,
            completedAtVersion: this.currentVersion,
        };

        await this.writeTrackerState(updatedState);
        this.syncConfig();

        return this.getState();
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
            return this.getState();
        }

        const updatedState: TrackerState = {
            completed: false,
            completedAtVersion: undefined,
        };

        await this.writeTrackerState(updatedState);
        this.syncConfig();

        return this.getState();
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

    private async readTrackerState(): Promise<TrackerState | undefined> {
        try {
            const content = await readFile(this.trackerPath, 'utf8');
            return JSON.parse(content) as TrackerState;
        } catch (error) {
            this.logger.debug(
                `Unable to read onboarding tracker state at ${this.trackerPath}: ${error}`
            );
            return undefined;
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
