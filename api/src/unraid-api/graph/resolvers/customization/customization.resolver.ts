import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { Public } from '@app/unraid-api/auth/public.decorator.js'; // Import Public decorator

import { OnboardingTracker } from '@app/unraid-api/config/onboarding-tracker.module.js';
import {
    ActivationCode,
    ActivationOnboarding,
    ActivationOnboardingStep,
    Customization,
    PublicPartnerInfo,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';
import { Theme } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';

@Resolver(() => Customization)
export class CustomizationResolver {
    constructor(
        private readonly onboardingService: OnboardingService,
        private readonly onboardingTracker: OnboardingTracker
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

    @Query(() => Theme)
    @Public()
    async publicTheme(): Promise<Theme> {
        return this.onboardingService.getTheme();
    }

    @Query(() => ActivationOnboarding, {
        description: 'Activation onboarding steps derived from current system state',
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CUSTOMIZATIONS,
    })
    async activationOnboarding(): Promise<ActivationOnboarding> {
        const snapshot = await this.onboardingTracker.getUpgradeSnapshot();

        const steps: ActivationOnboardingStep[] = snapshot.steps.map((step) => ({
            id: step.id,
            required: step.required,
            introducedIn: step.introducedIn,
            completed: snapshot.completedSteps.includes(step.id),
        }));

        return {
            isUpgrade:
                Boolean(snapshot.lastTrackedVersion) &&
                Boolean(snapshot.currentVersion) &&
                snapshot.lastTrackedVersion !== snapshot.currentVersion,
            previousVersion:
                snapshot.lastTrackedVersion && snapshot.lastTrackedVersion !== snapshot.currentVersion
                    ? snapshot.lastTrackedVersion
                    : undefined,
            currentVersion: snapshot.currentVersion,
            hasPendingSteps: steps.some((step) => !step.completed),
            steps,
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

    @ResolveField(() => Theme)
    async theme(): Promise<Theme> {
        return this.onboardingService.getTheme();
    }
}
