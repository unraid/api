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
import { OnboardingInternalBootService } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-internal-boot.service.js';
import { getOnboardingVersionDirection } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-status.util.js';
import {
    CreateInternalBootPoolInput,
    OnboardingInternalBootResult,
    OnboardingOverrideInput,
} from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';

@Resolver(() => OnboardingMutations)
export class OnboardingMutationsResolver {
    private static computeStatus(
        completedAtVersion: string | undefined,
        currentVersion: string,
        completed: boolean
    ): OnboardingStatus {
        const versionDirection = getOnboardingVersionDirection(completedAtVersion, currentVersion);

        if (!completed) {
            return OnboardingStatus.INCOMPLETE;
        }

        if (versionDirection === 'DOWNGRADE') {
            return OnboardingStatus.DOWNGRADE;
        }

        if (versionDirection === 'UPGRADE') {
            return OnboardingStatus.UPGRADE;
        }

        return OnboardingStatus.COMPLETED;
    }

    constructor(
        private readonly onboardingTracker: OnboardingTrackerService,
        private readonly onboardingOverrides: OnboardingOverrideService,
        private readonly onboardingService: OnboardingService,
        private readonly onboardingInternalBootService: OnboardingInternalBootService
    ) {}

    /**
     * Build a full Onboarding response with computed status
     */
    private async buildOnboardingResponse(state?: {
        completed: boolean;
        completedAtVersion?: string;
    }): Promise<Onboarding> {
        let effectiveState = state;
        if (!effectiveState) {
            const stateResult = await this.onboardingTracker.getStateResult();
            if (stateResult.kind === 'error') {
                throw stateResult.error;
            }

            effectiveState = stateResult.state;
        }

        const currentVersion = this.onboardingTracker.getCurrentVersion() ?? 'unknown';
        const partnerInfo = await this.onboardingService.getPublicPartnerInfo();
        const onboardingState = await this.onboardingService.getOnboardingState();
        const status = OnboardingMutationsResolver.computeStatus(
            effectiveState.completedAtVersion,
            currentVersion,
            effectiveState.completed
        );

        return {
            status,
            isPartnerBuild: partnerInfo !== null,
            completed: effectiveState.completed,
            completedAtVersion: effectiveState.completedAtVersion,
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
        const state = await this.onboardingTracker.markCompleted();
        return this.buildOnboardingResponse(state);
    }

    @ResolveField(() => Onboarding, {
        description: 'Reset onboarding progress (for testing)',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async resetOnboarding(): Promise<Onboarding> {
        const state = await this.onboardingTracker.reset();
        return this.buildOnboardingResponse(state);
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

    @ResolveField(() => OnboardingInternalBootResult, {
        description: 'Create and configure internal boot pool via emcmd operations',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async createInternalBootPool(
        @Args('input') input: CreateInternalBootPoolInput
    ): Promise<OnboardingInternalBootResult> {
        return this.onboardingInternalBootService.createInternalBootPool(input);
    }
}
