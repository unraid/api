import {
    Injectable,
    Logger,
    Module,
    OnApplicationBootstrap,
    OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import path from 'path';

import { writeFile } from 'atomically';

import { PATHS_CONFIG_MODULES } from '@app/environment.js';

const TRACKER_FILE_NAME = 'onboarding-tracker.json';
const LEGACY_TRACKER_FILE_NAME = 'os-version-tracker.json';
const CONFIG_PREFIX = 'onboardingTracker';
const OS_VERSION_FILE_PATH = '/etc/unraid-version';

type CompletedStepState = {
    version: string;
    completedAt: string;
};

type TrackerState = {
    lastTrackedVersion?: string;
    updatedAt?: string;
    completedSteps?: Record<string, CompletedStepState>;
};

export type UpgradeProgressSnapshot = {
    currentVersion?: string;
    lastTrackedVersion?: string;
    completedSteps: string[];
};

@Injectable()
export class OnboardingTracker implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly logger = new Logger(OnboardingTracker.name);
    private readonly trackerPath = path.join(PATHS_CONFIG_MODULES, TRACKER_FILE_NAME);
    private readonly legacyTrackerPath = path.join(PATHS_CONFIG_MODULES, LEGACY_TRACKER_FILE_NAME);
    private state: TrackerState = {};
    private sessionLastTrackedVersion?: string;
    private currentVersion?: string;

    constructor(private readonly configService: ConfigService) {}

    async onApplicationBootstrap() {
        this.currentVersion = await this.readCurrentVersion();
        if (!this.currentVersion) {
            this.state = {};
            this.sessionLastTrackedVersion = undefined;
            this.syncConfig(undefined);
            return;
        }

        const previousState = await this.readTrackerState();
        this.state = previousState ?? {};
        this.sessionLastTrackedVersion = previousState?.lastTrackedVersion;

        this.syncConfig(this.currentVersion);
    }

    async onApplicationShutdown() {
        if (!this.currentVersion) {
            return;
        }

        await this.ensureStateLoaded();
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
    }

    getUpgradeSnapshot(): UpgradeProgressSnapshot {
        const currentVersion =
            this.configService.get<string>(`${CONFIG_PREFIX}.currentVersion`) ??
            this.configService.get<string>('store.emhttp.var.version') ??
            undefined;

        const lastTrackedVersion =
            this.configService.get<string>(`${CONFIG_PREFIX}.lastTrackedVersion`) ?? undefined;

        const completedSteps =
            currentVersion && this.state.completedSteps
                ? this.completedStepsForVersion(currentVersion)
                : [];

        return {
            currentVersion,
            lastTrackedVersion,
            completedSteps,
        };
    }

    async markStepCompleted(stepId: string): Promise<UpgradeProgressSnapshot> {
        const currentVersion =
            this.configService.get<string>(`${CONFIG_PREFIX}.currentVersion`) ??
            this.configService.get<string>('store.emhttp.var.version') ??
            undefined;

        if (!currentVersion) {
            this.logger.warn(
                `Unable to mark onboarding step '${stepId}' as completed; current OS version unknown`
            );
            return this.getUpgradeSnapshot();
        }

        await this.ensureStateLoaded();
        const completedSteps = this.state.completedSteps ?? {};
        const existing = completedSteps[stepId];

        if (existing?.version === currentVersion) {
            return this.getUpgradeSnapshot();
        }

        completedSteps[stepId] = {
            version: currentVersion,
            completedAt: new Date().toISOString(),
        };

        const updatedState: TrackerState = {
            ...this.state,
            completedSteps,
            updatedAt: new Date().toISOString(),
        };

        await this.writeTrackerState(updatedState);
        this.syncConfig(currentVersion);

        return this.getUpgradeSnapshot();
    }

    private async ensureStateLoaded() {
        if (Object.keys(this.state).length > 0) {
            return;
        }
        this.state = (await this.readTrackerState()) ?? {};
    }

    private completedStepsForVersion(version: string): string[] {
        const completedEntries = this.state.completedSteps ?? {};
        return Object.entries(completedEntries)
            .filter(([, value]) => value?.version === version)
            .map(([stepId]) => stepId);
    }

    private syncConfig(currentVersion: string | undefined) {
        const completedStepsMap = this.state.completedSteps ?? {};
        this.configService.set(`${CONFIG_PREFIX}.currentVersion`, currentVersion);
        this.configService.set('store.emhttp.var.version', currentVersion);
        this.configService.set(`${CONFIG_PREFIX}.lastTrackedVersion`, this.sessionLastTrackedVersion);
        this.configService.set(`${CONFIG_PREFIX}.completedSteps`, completedStepsMap);
        this.configService.set('api.lastSeenOsVersion', this.sessionLastTrackedVersion);
    }

    private async readCurrentVersion(): Promise<string | undefined> {
        try {
            const contents = await readFile(OS_VERSION_FILE_PATH, 'utf8');
            const match = contents.match(/^\s*version\s*=\s*"([^"]+)"\s*$/m);
            return match?.[1]?.trim() || undefined;
        } catch (error) {
            this.logger.error(error, `Failed to read current OS version from ${OS_VERSION_FILE_PATH}`);
            return undefined;
        }
    }

    private async readTrackerState(): Promise<TrackerState | undefined> {
        try {
            const content = await readFile(this.trackerPath, 'utf8');
            return JSON.parse(content) as TrackerState;
        } catch (error) {
            this.logger.debug(error, `Unable to read onboarding tracker state at ${this.trackerPath}`);

            const legacyState = await this.readLegacyTrackerState();
            if (legacyState) {
                return legacyState;
            }

            return undefined;
        }
    }

    private async readLegacyTrackerState(): Promise<TrackerState | undefined> {
        try {
            const content = await readFile(this.legacyTrackerPath, 'utf8');
            this.logger.log(
                `Loaded legacy onboarding tracker state from ${LEGACY_TRACKER_FILE_NAME}; will persist to ${TRACKER_FILE_NAME}`
            );
            return JSON.parse(content) as TrackerState;
        } catch (error) {
            this.logger.debug(
                error,
                `Unable to read legacy onboarding tracker state at ${this.legacyTrackerPath}`
            );
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
}

@Module({
    providers: [OnboardingTracker],
    exports: [OnboardingTracker],
})
export class OnboardingTrackerModule {}
