import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';
import { Theme, ThemeName } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';
import { CustomizationMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';

@Resolver(() => CustomizationMutations)
export class CustomizationMutationsResolver {
    constructor(
        private readonly onboardingService: OnboardingService,
        private readonly displayService: DisplayService
    ) {}

    @ResolveField(() => Theme, { description: 'Update the UI theme (writes dynamix.cfg)' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CUSTOMIZATIONS,
    })
    async setTheme(
        @Args('theme', { type: () => ThemeName, description: 'Theme to apply' })
        theme: ThemeName
    ): Promise<Theme> {
        return this.onboardingService.setTheme(theme);
    }

    @ResolveField(() => String, { description: 'Update the display locale (language)' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CUSTOMIZATIONS,
    })
    async setLocale(
        @Args('locale', { type: () => String, description: 'Locale code to apply (e.g. en_US)' })
        locale: string
    ): Promise<string> {
        const display = await this.displayService.setLocale(locale);
        return display.locale ?? locale;
    }
}
