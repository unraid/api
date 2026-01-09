import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import type { OnboardingOverrideState } from '@app/unraid-api/config/onboarding-override.model.js';
import type { UpgradeProgressSnapshot } from '@app/unraid-api/config/onboarding-tracker.model.js';
import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import { OnboardingTracker } from '@app/unraid-api/config/onboarding-tracker.module.js';
import {
    ActivationOnboarding,
    ActivationOnboardingStep,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';
import { buildUpgradeInfoFromSnapshot } from '@app/unraid-api/graph/resolvers/info/versions/upgrade-info.util.js';
import { UpgradeInfo } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';
import { OnboardingMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import {
    CompleteUpgradeStepInput,
    OnboardingOverrideInput,
} from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';

@Resolver(() => OnboardingMutations)
export class OnboardingMutationsResolver {
    constructor(
        private readonly onboardingTracker: OnboardingTracker,
        private readonly onboardingOverrides: OnboardingOverrideService,
        private readonly onboardingService: OnboardingService
    ) {}

    @ResolveField(() => UpgradeInfo, {
        description: 'Marks an upgrade onboarding step as completed for the current OS version',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async completeUpgradeStep(@Args('input') input: CompleteUpgradeStepInput): Promise<UpgradeInfo> {
        const snapshot = await this.onboardingTracker.markStepCompleted(input.stepId);
        return buildUpgradeInfoFromSnapshot(snapshot);
    }

    @ResolveField(() => UpgradeInfo, {
        description: 'Reset upgrade onboarding progress for the current OS version',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async resetUpgradeOnboarding(): Promise<UpgradeInfo> {
        const snapshot = await this.onboardingTracker.resetUpgradeProgress();
        return buildUpgradeInfoFromSnapshot(snapshot);
    }

    @ResolveField(() => ActivationOnboarding, {
        description: 'Override onboarding state for testing (in-memory only)',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async setOnboardingOverride(
        @Args('input') input: OnboardingOverrideInput
    ): Promise<ActivationOnboarding> {
        const override: OnboardingOverrideState = {
            activationOnboarding: input.activationOnboarding,
            activationCode: input.activationCode,
            partnerInfo: input.partnerInfo,
            registrationState: input.registrationState,
            isInitialSetup: input.isInitialSetup,
        };
        this.onboardingOverrides.setState(override);
        this.onboardingService.clearActivationDataCache();
        const snapshot = await this.onboardingTracker.getUpgradeSnapshot();
        return this.buildActivationOnboarding(snapshot);
    }

    @ResolveField(() => ActivationOnboarding, {
        description: 'Clear onboarding override state and reload from disk',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async clearOnboardingOverride(): Promise<ActivationOnboarding> {
        this.onboardingOverrides.clearState();
        this.onboardingService.clearActivationDataCache();
        const snapshot = await this.onboardingTracker.getUpgradeSnapshot();
        return this.buildActivationOnboarding(snapshot);
    }

    private buildActivationOnboarding(snapshot: UpgradeProgressSnapshot): ActivationOnboarding {
        const steps: ActivationOnboardingStep[] = snapshot.steps.map((step) => ({
            id: step.id,
            required: step.required,
            introducedIn: step.introducedIn,
            completed: snapshot.completedSteps.includes(step.id),
        }));
        const hasBothVersions = snapshot.lastTrackedVersion != null && snapshot.currentVersion != null;

        return {
            isUpgrade: hasBothVersions && snapshot.lastTrackedVersion !== snapshot.currentVersion,
            previousVersion:
                hasBothVersions && snapshot.lastTrackedVersion !== snapshot.currentVersion
                    ? snapshot.lastTrackedVersion
                    : undefined,
            currentVersion: hasBothVersions ? snapshot.currentVersion : undefined,
            hasPendingSteps: steps.some((step) => !step.completed),
            steps,
        };
    }
}
