import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { Public } from '@app/unraid-api/auth/public.decorator.js';
import {
    ActivationCode,
    Customization,
    Onboarding,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';
import { Theme } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';
import { Language } from '@app/unraid-api/graph/resolvers/info/display/display.model.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';

@Resolver(() => Customization)
export class CustomizationResolver {
    constructor(
        private readonly onboardingService: OnboardingService,
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
        return this.onboardingService.getOnboardingResponse({ includeActivationCode: true });
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
