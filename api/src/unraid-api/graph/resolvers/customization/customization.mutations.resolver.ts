import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { CustomizationService } from '@app/unraid-api/graph/resolvers/customization/customization.service.js';
import { Theme, ThemeName } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';
import { CustomizationMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';

@Resolver(() => CustomizationMutations)
export class CustomizationMutationsResolver {
    constructor(private readonly customizationService: CustomizationService) {}

    @ResolveField(() => Theme, { description: 'Update the UI theme (writes dynamix.cfg)' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CUSTOMIZATIONS,
    })
    async setTheme(
        @Args('theme', { type: () => ThemeName, description: 'Theme to apply' })
        theme: ThemeName
    ): Promise<Theme> {
        return this.customizationService.setTheme(theme);
    }
}
