import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { Public } from '@app/unraid-api/auth/public.decorator.js';
import { OnboardingTrackerService } from '@app/unraid-api/config/onboarding-tracker.module.js';
import {
    ActivationCode,
    Customization,
    Onboarding,
    OnboardingStatus,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';
import { Theme } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';
import { Language } from '@app/unraid-api/graph/resolvers/info/display/display.model.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';
import { getOnboardingVersionDirection } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-status.util.js';

@Resolver(() => Customization)
export class CustomizationResolver {
    constructor(
        private readonly onboardingService: OnboardingService,
        private readonly onboardingTracker: OnboardingTrackerService,
        private readonly displayService: DisplayService
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

    @ResolveField(() => Onboarding, {
        name: 'onboarding',
        description: 'Onboarding completion state and context',
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CUSTOMIZATIONS,
    })
    async resolveOnboarding(): Promise<Onboarding> {
        const state = this.onboardingTracker.getState();
        const currentVersion = this.onboardingTracker.getCurrentVersion() ?? 'unknown';
        const partnerInfo = await this.onboardingService.getPublicPartnerInfo();
        const activationData = await this.onboardingService.getActivationData();
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

        // Get the activation code string if present and non-empty
        const activationCode = activationData?.code?.trim() || undefined;

        return {
            status,
            isPartnerBuild: partnerInfo !== null,
            completed: state.completed,
            completedAtVersion: state.completedAtVersion,
            activationCode,
            onboardingState,
        };
    }

    @ResolveField(() => [Language], { nullable: true, name: 'availableLanguages' })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DISPLAY,
    })
    async resolveAvailableLanguages(): Promise<Language[]> {
        return this.displayService.getAvailableLanguages();
    }

    @ResolveField(() => ActivationCode, { nullable: true, name: 'activationCode' })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.ACTIVATION_CODE,
    })
    async activationCode(): Promise<ActivationCode | null> {
        return this.onboardingService.getActivationDataForPublic();
    }
}
