import {
    Injectable,
    Logger,
    Module,
    OnApplicationBootstrap,
    OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile, writeFile as writeFileFs } from 'fs/promises';
import path from 'path';

import { writeFile } from 'atomically';
import { compare } from 'semver';

import type {
    ActivationStepContext,
    ActivationStepDefinition,
} from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';
import { PATHS_CONFIG_MODULES } from '@app/environment.js';
import { getters } from '@app/store/index.js';
import {
    type CompletedStepState,
    type TrackerState,
    type UpgradeProgressSnapshot,
    type UpgradeStepState,
} from '@app/unraid-api/config/onboarding-tracker.model.js';
import { ActivationOnboardingStepId } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import {
    findActivationCodeFile,
    resolveActivationStepDefinitions,
} from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';

const TRACKER_FILE_NAME = 'onboarding-tracker.json';
const CONFIG_PREFIX = 'onboardingTracker';
const DEFAULT_OS_VERSION_FILE_PATH = '/etc/unraid-version';
export const UPGRADE_MARKER_PATH = '/tmp/unraid-onboarding-last-version';

@Injectable()
export class OnboardingTracker implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly logger = new Logger(OnboardingTracker.name);
    private readonly trackerPath = path.join(PATHS_CONFIG_MODULES, TRACKER_FILE_NAME);
    private state: TrackerState = {};
    private sessionLastTrackedVersion?: string;
    private currentVersion?: string;
    private readonly versionFilePath: string;

    constructor(private readonly configService: ConfigService) {
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
        await this.writeUpgradeMarker(this.currentVersion);
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

    async getUpgradeSnapshot(): Promise<UpgradeProgressSnapshot> {
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

        const steps = await this.computeStepsForUpgrade(lastTrackedVersion, currentVersion);
        const completedSteps = this.completedStepsForSteps(steps);

        return {
            currentVersion,
            lastTrackedVersion,
            completedSteps,
            steps,
        };
    }

    async markStepCompleted(stepId: ActivationOnboardingStepId): Promise<UpgradeProgressSnapshot> {
        const currentVersion =
            this.currentVersion ??
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
        const completedSteps =
            this.state.completedSteps ?? ({} as Record<ActivationOnboardingStepId, CompletedStepState>);
        const existing = completedSteps[stepId];

        const steps = await this.computeStepsForUpgrade(this.sessionLastTrackedVersion, currentVersion);
        const stepDefinition = steps.find((step) => step.id === stepId);
        const stepDefinitionVersion = stepDefinition?.introducedIn ?? currentVersion;

        if (this.isCompletionUpToDate(existing?.version, stepDefinitionVersion)) {
            return this.getUpgradeSnapshot();
        }

        completedSteps[stepId] = {
            version: stepDefinitionVersion,
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

    private completedStepsForSteps(steps: UpgradeStepState[]): ActivationOnboardingStepId[] {
        const completedEntries =
            this.state.completedSteps ?? ({} as Record<ActivationOnboardingStepId, CompletedStepState>);
        if (steps.length === 0) {
            return Object.keys(completedEntries).filter((key) =>
                Object.values(ActivationOnboardingStepId).includes(key as ActivationOnboardingStepId)
            ) as ActivationOnboardingStepId[];
        }

        return steps
            .filter((step) => {
                const completion = completedEntries[step.id];
                if (!completion?.version) {
                    return false;
                }
                const definitionVersion = step.introducedIn ?? completion.version;
                return this.isCompletionUpToDate(completion.version, definitionVersion);
            })
            .map((step) => step.id);
    }

    private async computeStepsForUpgrade(
        _fromVersion: string | undefined,
        toVersion: string | undefined
    ): Promise<UpgradeStepState[]> {
        const fallbackVersion = toVersion ?? 'unknown';
        try {
            const context = await this.buildStepContext();
            const stepConfigs = await resolveActivationStepDefinitions(context);
            return stepConfigs.map((step) => this.normalizeStep(step, fallbackVersion));
        } catch (error) {
            this.logger.error(error, 'Failed to evaluate activation onboarding steps');
            return [];
        }
    }

    private normalizeStep(step: ActivationStepDefinition, fallbackVersion: string): UpgradeStepState {
        return {
            id: step.id,
            required: Boolean(step.required),
            introducedIn: step.introducedIn ?? fallbackVersion,
        };
    }

    private async buildStepContext(): Promise<ActivationStepContext> {
        const emhttp = getters.emhttp?.() ?? {};
        const regState = emhttp?.var?.regState as string | undefined;

        const paths = getters.paths?.() ?? {};
        const activationBase = paths?.activationBase as string | undefined;

        const activationPath =
            typeof activationBase === 'string' && activationBase.length > 0
                ? await findActivationCodeFile(activationBase, '.activationcode', this.logger)
                : null;
        const hasActivationCode = Boolean(activationPath);

        return {
            hasActivationCode,
            regState,
        };
    }

    private isCompletionUpToDate(existingVersion: string | undefined, requiredVersion: string): boolean {
        if (!existingVersion) {
            return false;
        }

        try {
            return compare(existingVersion, requiredVersion) >= 0;
        } catch {
            return existingVersion === requiredVersion;
        }
    }

    private syncConfig(currentVersion: string | undefined) {
        const completedStepsMap =
            this.state.completedSteps ?? ({} as Record<ActivationOnboardingStepId, CompletedStepState>);
        this.configService.set(`${CONFIG_PREFIX}.currentVersion`, currentVersion);
        this.configService.set('store.emhttp.var.version', currentVersion);
        this.configService.set(`${CONFIG_PREFIX}.lastTrackedVersion`, this.sessionLastTrackedVersion);
        this.configService.set(`${CONFIG_PREFIX}.completedSteps`, completedStepsMap);
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
}

@Module({
    providers: [OnboardingTracker],
    exports: [OnboardingTracker],
})
export class OnboardingTrackerModule {}

export type {
    UpgradeProgressSnapshot,
    UpgradeStepState,
} from '@app/unraid-api/config/onboarding-tracker.model.js';
