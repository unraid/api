import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { Public } from '@app/unraid-api/auth/public.decorator.js';
import { OnboardingTrackerService } from '@app/unraid-api/config/onboarding-tracker.module.js';
import {
    ActivationCode,
    Customization,
    Onboarding,
    OnboardingState,
    OnboardingStatus,
    PublicPartnerInfo,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';
import { Theme } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';
import { getOnboardingVersionDirection } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-status.util.js';

@Resolver(() => Customization)
export class CustomizationResolver {
    constructor(
        private readonly onboardingService: OnboardingService,
        private readonly onboardingTracker: OnboardingTrackerService
    ) {}

    // Authenticated query
    @Query(() => Customization, { nullable: true })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CUSTOMIZATIONS,
    })
    async customization(): Promise<Customization | null> {
        // We return an empty object because the fields are resolved by @ResolveField
        return {};
    }

    // Dedicated public query - calls the internal helper
    @Query(() => PublicPartnerInfo, { nullable: true })
    @Public()
    async publicPartnerInfo(): Promise<PublicPartnerInfo | null> {
        return this.onboardingService.getPublicPartnerInfo();
    }

    @Query(() => Boolean, {
        description: 'Whether the system is a fresh install (no license key)',
    })
    @Public()
    async isFreshInstall(): Promise<boolean> {
        return this.onboardingService.isFreshInstall();
    }

    @Query(() => Theme)
    @Public()
    async publicTheme(): Promise<Theme> {
        return this.onboardingService.getTheme();
    }

    @Query(() => Onboarding, {
        description: 'Onboarding completion state and context',
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CUSTOMIZATIONS,
    })
    async onboarding(): Promise<Onboarding> {
        const state = this.onboardingTracker.getState();
        const currentVersion = this.onboardingTracker.getCurrentVersion() ?? 'unknown';
        const partnerInfo = await this.onboardingService.getPublicPartnerInfo();
        const activationData = await this.onboardingService.getActivationData();
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

        // Get the activation code string if present and non-empty
        const activationCode = activationData?.code?.trim() || undefined;

        return {
            status,
            isPartnerBuild: partnerInfo !== null,
            completed: state.completed,
            completedAtVersion: state.completedAtVersion,
            activationCode,
        };
    }

    @ResolveField(() => PublicPartnerInfo, { nullable: true, name: 'partnerInfo' })
    async resolvePartnerInfo(): Promise<PublicPartnerInfo | null> {
        return this.onboardingService.getPublicPartnerInfo();
    }

    @ResolveField(() => ActivationCode, { nullable: true, name: 'activationCode' })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.ACTIVATION_CODE,
    })
    async activationCode(): Promise<ActivationCode | null> {
        return this.onboardingService.getActivationData();
    }

    @ResolveField(() => OnboardingState, { name: 'onboardingState' })
    async resolveOnboardingState(): Promise<OnboardingState> {
        return this.onboardingService.getOnboardingState();
    }
}
