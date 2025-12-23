import {
    Injectable,
    Logger,
    Module,
    OnApplicationBootstrap,
    OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile, unlink, writeFile as writeFileFs } from 'fs/promises';
import path from 'path';

import { writeFile } from 'atomically';
import { compare } from 'semver';

import type {
    ActivationOnboardingOverrideState,
    ActivationOnboardingOverrideStepState,
    OnboardingOverrideState,
} from '@app/unraid-api/config/onboarding-override.model.js';
import type {
    ActivationStepContext,
    ActivationStepDefinition,
} from '@app/unraid-api/graph/resolvers/customization/activation-steps.util.js';
import { PATHS_CONFIG_MODULES } from '@app/environment.js';
import { OnboardingOverrideModule } from '@app/unraid-api/config/onboarding-override.module.js';
import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import { OnboardingStateModule } from '@app/unraid-api/config/onboarding-state.module.js';
import { OnboardingStateService } from '@app/unraid-api/config/onboarding-state.service.js';
import {
    type CompletedStepState,
    type TrackerState,
    type UpgradeProgressSnapshot,
    type UpgradeStepState,
} from '@app/unraid-api/config/onboarding-tracker.model.js';
import { ActivationOnboardingStepId } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import {
    activationStepDefinitions,
    resolveActivationStepDefinitions,
} from '@app/unraid-api/graph/resolvers/customization/activation-steps.util.js';

const TRACKER_FILE_NAME = 'onboarding-tracker.json';
const CONFIG_PREFIX = 'onboardingTracker';
const DEFAULT_OS_VERSION_FILE_PATH = '/etc/unraid-version';
export const UPGRADE_MARKER_PATH = '/tmp/unraid-onboarding-last-version';
const DEFAULT_OVERRIDE_STEPS: ActivationOnboardingOverrideStepState[] = activationStepDefinitions.map(
    (step) => ({
        id: step.id,
        required: step.required,
        completed: false,
        introducedIn: step.introducedIn,
    })
);
const DEFAULT_OVERRIDE_LOOKUP = activationStepDefinitions.reduce<
    Record<ActivationOnboardingStepId, ActivationStepDefinition>
>(
    (acc, step) => {
        acc[step.id] = step;
        return acc;
    },
    {} as Record<ActivationOnboardingStepId, ActivationStepDefinition>
);

@Injectable()
export class OnboardingTracker implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly logger = new Logger(OnboardingTracker.name);
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

        const steps = await this.computeStepsForUpgrade(
            this.sessionLastTrackedVersion,
            this.currentVersion
        );
        const completedEntries =
            this.state.completedSteps ?? ({} as Record<ActivationOnboardingStepId, CompletedStepState>);
        const allStepsCompleted = this.areAllStepsCompleted(steps, completedEntries);

        if (!allStepsCompleted) {
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
        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.activationOnboarding) {
            const updatedOverride = this.markOverrideStepCompleted(overrideState, stepId);
            this.onboardingOverrides.setState(updatedOverride);
            return this.buildOverrideSnapshot(updatedOverride.activationOnboarding);
        }

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

        const allStepsCompleted = this.areAllStepsCompleted(steps, completedSteps);

        const updatedState: TrackerState = {
            ...this.state,
            completedSteps,
            updatedAt: new Date().toISOString(),
            ...(allStepsCompleted && currentVersion ? { lastTrackedVersion: currentVersion } : {}),
        };

        await this.writeTrackerState(updatedState);
        if (allStepsCompleted && currentVersion) {
            this.sessionLastTrackedVersion = currentVersion;
            await this.clearUpgradeMarker();
        }
        this.syncConfig(currentVersion);

        return this.getUpgradeSnapshot();
    }

    async resetUpgradeProgress(): Promise<UpgradeProgressSnapshot> {
        const overrideState = this.onboardingOverrides.getState();
        if (overrideState?.activationOnboarding) {
            const updatedOverride = this.resetOverrideSteps(overrideState);
            this.onboardingOverrides.setState(updatedOverride);
            return this.buildOverrideSnapshot(updatedOverride.activationOnboarding);
        }

        await this.ensureStateLoaded();

        const updatedState: TrackerState = {
            ...this.state,
            completedSteps: {} as Record<ActivationOnboardingStepId, CompletedStepState>,
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

    private areAllStepsCompleted(
        steps: UpgradeStepState[],
        completedSteps: Record<ActivationOnboardingStepId, CompletedStepState>
    ): boolean {
        return steps.every((step) => {
            if (!step.required) {
                return true;
            }
            const completion = completedSteps[step.id];
            if (!completion?.version) {
                return false;
            }
            const definitionVersion = step.introducedIn ?? completion.version;
            return this.isCompletionUpToDate(completion.version, definitionVersion);
        });
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
        return this.onboardingState.getActivationStepContext();
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
        const normalizedSteps = this.normalizeOverrideSteps(override.steps);
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
            completedSteps: normalizedSteps.filter((step) => step.completed).map((step) => step.id),
            steps: normalizedSteps.map((step) => ({
                id: step.id,
                required: step.required ?? false,
                introducedIn: step.introducedIn,
            })),
        };
    }

    private normalizeOverrideSteps(
        steps: ActivationOnboardingOverrideStepState[] | undefined
    ): ActivationOnboardingOverrideStepState[] {
        const sourceSteps = steps && steps.length > 0 ? steps : DEFAULT_OVERRIDE_STEPS;
        return sourceSteps.map((step) => {
            const defaults = DEFAULT_OVERRIDE_LOOKUP[step.id];
            return {
                id: step.id,
                required: step.required ?? defaults?.required ?? false,
                completed: step.completed ?? false,
                introducedIn: step.introducedIn ?? defaults?.introducedIn,
            };
        });
    }

    private markOverrideStepCompleted(
        overrideState: OnboardingOverrideState,
        stepId: ActivationOnboardingStepId
    ): OnboardingOverrideState {
        const override = overrideState.activationOnboarding;
        if (!override) {
            return overrideState;
        }

        const normalizedSteps = this.normalizeOverrideSteps(override.steps);
        const updatedSteps = normalizedSteps.map((step) =>
            step.id === stepId ? { ...step, completed: true } : step
        );

        return {
            ...overrideState,
            activationOnboarding: {
                ...override,
                steps: updatedSteps,
            },
        };
    }

    private resetOverrideSteps(overrideState: OnboardingOverrideState): OnboardingOverrideState {
        const override = overrideState.activationOnboarding;
        if (!override) {
            return overrideState;
        }

        const normalizedSteps = this.normalizeOverrideSteps(override.steps);
        const resetSteps = normalizedSteps.map((step) => ({ ...step, completed: false }));

        return {
            ...overrideState,
            activationOnboarding: {
                ...override,
                steps: resetSteps,
            },
        };
    }
}

@Module({
    imports: [OnboardingOverrideModule, OnboardingStateModule],
    providers: [OnboardingTracker],
    exports: [OnboardingTracker],
})
export class OnboardingTrackerModule {}

export type {
    UpgradeProgressSnapshot,
    UpgradeStepState,
} from '@app/unraid-api/config/onboarding-tracker.model.js';
