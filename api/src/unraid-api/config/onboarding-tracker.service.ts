import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile, unlink, writeFile as writeFileFs } from 'fs/promises';
import path from 'path';

import { writeFile } from 'atomically';

import type {
    ActivationOnboardingOverrideState,
    OnboardingOverrideState,
} from '@app/unraid-api/config/onboarding-override.model.js';
import { PATHS_CONFIG_MODULES } from '@app/environment.js';
import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import { OnboardingStateService } from '@app/unraid-api/config/onboarding-state.service.js';
import {
    type TrackerState,
    type UpgradeProgressSnapshot,
} from '@app/unraid-api/config/onboarding-tracker.model.js';

const TRACKER_FILE_NAME = 'onboarding-tracker.json';
const CONFIG_PREFIX = 'onboardingTracker';
const DEFAULT_OS_VERSION_FILE_PATH = '/etc/unraid-version';
export const UPGRADE_MARKER_PATH = '/tmp/unraid-onboarding-last-version';

@Injectable()
export class OnboardingTrackerService implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly logger = new Logger(OnboardingTrackerService.name);
    private readonly trackerPath = path.join(PATHS_CONFIG_MODULES, TRACKER_FILE_NAME);
    private state: TrackerState = {};
    private sessionLastTrackedVersion?: string;
    private currentVersion?: string;
    private readonly versionFilePath: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly onboardingOverrides: OnboardingOverrideService,
        private readonly onboardingState: OnboardingStateService
    ) {
        const unraidDataDir = this.configService.get<string>('PATHS_UNRAID_DATA');
        this.versionFilePath = unraidDataDir
            ? path.join(unraidDataDir, 'unraid-version')
            : DEFAULT_OS_VERSION_FILE_PATH;
    }

    async onApplicationBootstrap() {
        this.currentVersion = await this.readCurrentVersion();
        if (!this.currentVersion) {
            this.state = {};
            this.sessionLastTrackedVersion = undefined;
            this.syncConfig(undefined);
            await this.writeUpgradeMarker(undefined);
            return;
        }

        const markerVersion = await this.readUpgradeMarker();
        const previousState = await this.readTrackerState();
        this.state = previousState ?? {};
        let inferredLastTrackedVersion = previousState?.lastTrackedVersion;

        if (
            markerVersion &&
            markerVersion !== this.currentVersion &&
            (inferredLastTrackedVersion == null || inferredLastTrackedVersion === this.currentVersion)
        ) {
            inferredLastTrackedVersion = markerVersion;
        }

        this.sessionLastTrackedVersion = inferredLastTrackedVersion;

        this.syncConfig(this.currentVersion);
        if (!markerVersion) {
            const markerValue = this.sessionLastTrackedVersion ?? this.currentVersion;
            if (markerValue) {
                await this.writeUpgradeMarker(markerValue);
            }
        }
    }

    async onApplicationShutdown() {
        if (!this.currentVersion) {
            return;
        }

        await this.ensureStateLoaded();

        const completedVersions = this.state.completedVersions ?? [];
        const isCurrentCompleted = completedVersions.includes(this.currentVersion);

        if (!isCurrentCompleted) {
            return;
        }

        if (this.state.lastTrackedVersion === this.currentVersion) {
            return;
        }

        const updatedState: TrackerState = {
            ...this.state,
            lastTrackedVersion: this.currentVersion,
            updatedAt: new Date().toISOString(),
        };

        await this.writeTrackerState(updatedState);
        this.sessionLastTrackedVersion = this.currentVersion;
        await this.clearUpgradeMarker();
    }

    async ensureFirstBootCompleted(): Promise<boolean> {
        await this.ensureStateLoaded();

        if (this.state.firstBootCompletedAt) {
            this.syncConfig(this.currentVersion);
            return true;
        }

        const timestamp = new Date().toISOString();
        const updatedState: TrackerState = {
            ...this.state,
            firstBootCompletedAt: timestamp,
            updatedAt: timestamp,
        };

        await this.writeTrackerState(updatedState);
        this.syncConfig(this.currentVersion);
        return false;
    }

    async getUpgradeSnapshot(): Promise<UpgradeProgressSnapshot> {
        const overrideSnapshot = this.getOverrideSnapshot();
        if (overrideSnapshot) {
            return overrideSnapshot;
        }

        const currentVersion =
            this.currentVersion ??
            this.configService.get<string>(`${CONFIG_PREFIX}.currentVersion`) ??
            this.configService.get<string>('store.emhttp.var.version') ??
            undefined;

        const lastTrackedVersion =
            this.sessionLastTrackedVersion ??
            this.configService.get<string>(`${CONFIG_PREFIX}.lastTrackedVersion`) ??
            undefined;

        await this.ensureStateLoaded();

        const completedVersions = this.state.completedVersions ?? [];
        const isCompleted = currentVersion ? completedVersions.includes(currentVersion) : false;

        return {
            currentVersion,
            lastTrackedVersion,
            completed: isCompleted,
        };
    }

    async markOnboardingCompleted(): Promise<UpgradeProgressSnapshot> {
        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.activationOnboarding) {
            const updatedOverride = this.markOverrideCompleted(overrideState);
            this.onboardingOverrides.setState(updatedOverride);
            if (updatedOverride.activationOnboarding) {
                return this.buildOverrideSnapshot(updatedOverride.activationOnboarding);
            }
        }

        const currentVersion =
            this.currentVersion ??
            this.configService.get<string>(`${CONFIG_PREFIX}.currentVersion`) ??
            this.configService.get<string>('store.emhttp.var.version') ??
            undefined;

        if (!currentVersion) {
            this.logger.warn(`Unable to mark onboarding as completed; current OS version unknown`);
            return this.getUpgradeSnapshot();
        }

        await this.ensureStateLoaded();
        const completedVersions = this.state.completedVersions ?? [];

        if (completedVersions.includes(currentVersion)) {
            return this.getUpgradeSnapshot();
        }

        const nextCompletedVersions = [...completedVersions, currentVersion];

        const updatedState: TrackerState = {
            ...this.state,
            completedVersions: nextCompletedVersions,
            updatedAt: new Date().toISOString(),
            lastTrackedVersion: currentVersion,
        };

        await this.writeTrackerState(updatedState);
        this.sessionLastTrackedVersion = currentVersion;
        await this.clearUpgradeMarker();
        this.syncConfig(currentVersion);

        return this.getUpgradeSnapshot();
    }

    async resetUpgradeProgress(): Promise<UpgradeProgressSnapshot> {
        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.activationOnboarding) {
            const updatedOverride = this.resetOverride(overrideState);
            this.onboardingOverrides.setState(updatedOverride);
            if (updatedOverride.activationOnboarding) {
                return this.buildOverrideSnapshot(updatedOverride.activationOnboarding);
            }
        }

        await this.ensureStateLoaded();

        const updatedState: TrackerState = {
            ...this.state,
            completedVersions: [],
            updatedAt: new Date().toISOString(),
        };

        await this.writeTrackerState(updatedState);
        this.syncConfig(this.currentVersion);

        return this.getUpgradeSnapshot();
    }

    private async ensureStateLoaded() {
        if (Object.keys(this.state).length > 0) {
            return;
        }
        this.state = (await this.readTrackerState()) ?? {};
    }

    private async readUpgradeMarker(): Promise<string | undefined> {
        try {
            const contents = await readFile(UPGRADE_MARKER_PATH, 'utf8');
            const version = contents.trim();
            return version.length > 0 ? version : undefined;
        } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                return undefined;
            }
            this.logger.debug(error, `Unable to read upgrade marker at ${UPGRADE_MARKER_PATH}`);
            return undefined;
        }
    }

    private async writeUpgradeMarker(version: string | undefined): Promise<void> {
        try {
            if (!version) {
                return;
            }
            await writeFileFs(UPGRADE_MARKER_PATH, version, 'utf8');
        } catch (error) {
            this.logger.warn(error, 'Failed to persist onboarding upgrade marker');
        }
    }

    private async clearUpgradeMarker(): Promise<void> {
        try {
            await unlink(UPGRADE_MARKER_PATH);
        } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                return;
            }
            this.logger.debug(error, 'Failed to remove onboarding upgrade marker');
        }
    }

    private syncConfig(currentVersion: string | undefined) {
        this.configService.set(`${CONFIG_PREFIX}.currentVersion`, currentVersion);
        this.configService.set('store.emhttp.var.version', currentVersion);
        this.configService.set(`${CONFIG_PREFIX}.lastTrackedVersion`, this.sessionLastTrackedVersion);
        this.configService.set(`${CONFIG_PREFIX}.completedVersions`, this.state.completedVersions);
        this.configService.set(`${CONFIG_PREFIX}.firstBootCompletedAt`, this.state.firstBootCompletedAt);
    }

    private async readCurrentVersion(): Promise<string | undefined> {
        try {
            const contents = await readFile(this.versionFilePath, 'utf8');
            const match = contents.match(/^\s*version\s*=\s*"([^"]+)"\s*$/m);
            return match?.[1]?.trim() || undefined;
        } catch (error) {
            this.logger.error(error, `Failed to read current OS version from ${this.versionFilePath}`);
            return undefined;
        }
    }

    private async readTrackerState(): Promise<TrackerState | undefined> {
        try {
            const content = await readFile(this.trackerPath, 'utf8');
            return JSON.parse(content) as TrackerState;
        } catch (error) {
            this.logger.debug(error, `Unable to read onboarding tracker state at ${this.trackerPath}`);
            return undefined;
        }
    }

    private async writeTrackerState(state: TrackerState): Promise<void> {
        try {
            await writeFile(this.trackerPath, JSON.stringify(state, null, 2), { mode: 0o644 });
            this.state = state;
        } catch (error) {
            this.logger.error(error, 'Failed to persist onboarding tracker state');
        }
    }

    private getOverrideSnapshot(): UpgradeProgressSnapshot | null {
        const overrideState = this.onboardingOverrides.getState();
        if (!overrideState?.activationOnboarding) {
            return null;
        }
        return this.buildOverrideSnapshot(overrideState.activationOnboarding);
    }

    private buildOverrideSnapshot(override: ActivationOnboardingOverrideState): UpgradeProgressSnapshot {
        const currentVersion = override.currentVersion ?? undefined;
        const computedUpgrade =
            typeof override.isUpgrade === 'boolean'
                ? override.isUpgrade
                : Boolean(
                      currentVersion &&
                          override.previousVersion &&
                          currentVersion !== override.previousVersion
                  );
        const lastTrackedVersion = computedUpgrade
            ? (override.previousVersion ?? undefined)
            : currentVersion;

        return {
            currentVersion,
            lastTrackedVersion,
            completed: override.completed ?? false,
        };
    }

    private markOverrideCompleted(overrideState: OnboardingOverrideState): OnboardingOverrideState {
        const override = overrideState.activationOnboarding;
        if (!override) {
            return overrideState;
        }

        return {
            ...overrideState,
            activationOnboarding: {
                ...override,
                completed: true,
            },
        };
    }

    private resetOverride(overrideState: OnboardingOverrideState): OnboardingOverrideState {
        const override = overrideState.activationOnboarding;
        if (!override) {
            return overrideState;
        }

        return {
            ...overrideState,
            activationOnboarding: {
                ...override,
                completed: false,
            },
        };
    }
}
