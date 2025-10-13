import { ConfigService } from '@nestjs/config';
import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { OnboardingTracker } from '@app/unraid-api/config/onboarding-tracker.module.js';
import { UpgradeInfo } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';
import { OnboardingMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import { CompleteUpgradeStepInput } from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';

@Resolver(() => OnboardingMutations)
export class OnboardingMutationsResolver {
    constructor(
        private readonly onboardingTracker: OnboardingTracker,
        private readonly configService: ConfigService
    ) {}

    @ResolveField(() => UpgradeInfo, {
        description: 'Marks an upgrade onboarding step as completed for the current OS version',
    })
    async completeUpgradeStep(@Args('input') input: CompleteUpgradeStepInput): Promise<UpgradeInfo> {
        await this.onboardingTracker.markStepCompleted(input.stepId);
        return this.buildUpgradeInfo();
    }

    private buildUpgradeInfo(): UpgradeInfo {
        const currentVersion =
            this.configService.get<string>('onboardingTracker.currentVersion') ??
            this.configService.get<string>('store.emhttp.var.version');
        const lastSeenVersion =
            this.configService.get<string>('onboardingTracker.lastTrackedVersion') ??
            this.configService.get<string>('api.lastSeenOsVersion');
        const completedStepsMap =
            this.configService.get<Record<string, { version: string }>>(
                'onboardingTracker.completedSteps'
            ) ?? {};

        const completedSteps =
            currentVersion && completedStepsMap
                ? Object.entries(completedStepsMap)
                      .filter(([, value]) => value?.version === currentVersion)
                      .map(([stepId]) => stepId)
                : [];

        const isUpgrade = Boolean(
            lastSeenVersion && currentVersion && lastSeenVersion !== currentVersion
        );

        return {
            isUpgrade,
            previousVersion: isUpgrade ? lastSeenVersion : undefined,
            currentVersion: currentVersion || undefined,
            completedSteps,
        };
    }
}
