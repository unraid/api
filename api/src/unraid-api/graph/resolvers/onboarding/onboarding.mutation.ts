import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import type { OnboardingOverrideState } from '@app/unraid-api/config/onboarding-override.model.js';
import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import { OnboardingTrackerService } from '@app/unraid-api/config/onboarding-tracker.module.js';
import {
    Onboarding,
    OnboardingStatus,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';
import { OnboardingMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import { getOnboardingVersionDirection } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-status.util.js';
import { OnboardingOverrideInput } from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';

@Resolver(() => OnboardingMutations)
export class OnboardingMutationsResolver {
    constructor(
        private readonly onboardingTracker: OnboardingTrackerService,
        private readonly onboardingOverrides: OnboardingOverrideService,
        private readonly onboardingService: OnboardingService
    ) {}

    /**
     * Build a full Onboarding response with computed status
     */
    private async buildOnboardingResponse(): Promise<Onboarding> {
        const state = this.onboardingTracker.getState();
        const currentVersion = this.onboardingTracker.getCurrentVersion() ?? 'unknown';
        const partnerInfo = await this.onboardingService.getPublicPartnerInfo();
        const onboardingState = await this.onboardingService.getOnboardingState();
        const versionDirection = getOnboardingVersionDirection(state.completedAtVersion, currentVersion);

        // Compute the status based on completion state and version
        let status: OnboardingStatus;
        if (!state.completed) {
            status = OnboardingStatus.INCOMPLETE;
        } else if (versionDirection === 'DOWNGRADE') {
            status = OnboardingStatus.DOWNGRADE;
        } else if (versionDirection === 'UPGRADE') {
            status = OnboardingStatus.UPGRADE;
        } else {
            status = OnboardingStatus.COMPLETED;
        }

        return {
            status,
            isPartnerBuild: partnerInfo !== null,
            completed: state.completed,
            completedAtVersion: state.completedAtVersion,
            onboardingState,
        };
    }

    @ResolveField(() => Onboarding, {
        description: 'Marks the onboarding flow as completed',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async completeOnboarding(): Promise<Onboarding> {
        await this.onboardingTracker.markCompleted();
        return this.buildOnboardingResponse();
    }

    @ResolveField(() => Onboarding, {
        description: 'Reset onboarding progress (for testing)',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async resetOnboarding(): Promise<Onboarding> {
        await this.onboardingTracker.reset();
        return this.buildOnboardingResponse();
    }

    @ResolveField(() => Onboarding, {
        description: 'Override onboarding state for testing (in-memory only)',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async setOnboardingOverride(@Args('input') input: OnboardingOverrideInput): Promise<Onboarding> {
        const override: OnboardingOverrideState = {
            onboarding: input.onboarding,
            activationCode: input.activationCode,
            partnerInfo: input.partnerInfo,
            registrationState: input.registrationState,
        };
        this.onboardingOverrides.setState(override);
        this.onboardingService.clearActivationDataCache();
        return this.buildOnboardingResponse();
    }

    @ResolveField(() => Onboarding, {
        description: 'Clear onboarding override state and reload from disk',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async clearOnboardingOverride(): Promise<Onboarding> {
        this.onboardingOverrides.clearState();
        this.onboardingService.clearActivationDataCache();
        return this.buildOnboardingResponse();
    }
}
