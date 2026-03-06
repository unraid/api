import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { UnraidPluginsMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import {
    InstallPluginInput,
    PluginInstallOperation,
} from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.model.js';
import { UnraidPluginsService } from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.service.js';

@Resolver(() => UnraidPluginsMutations)
export class UnraidPluginsMutationsResolver {
    constructor(private readonly pluginsService: UnraidPluginsService) {}

    @ResolveField(() => PluginInstallOperation, {
        description: 'Installs an Unraid plugin and begins tracking its progress',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CONFIG,
    })
    async installPlugin(@Args('input') input: InstallPluginInput): Promise<PluginInstallOperation> {
        return this.pluginsService.installPlugin(input);
    }

    @ResolveField(() => PluginInstallOperation, {
        description: 'Installs an Unraid language pack and begins tracking its progress',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CONFIG,
    })
    async installLanguage(@Args('input') input: InstallPluginInput): Promise<PluginInstallOperation> {
        return this.pluginsService.installLanguage(input);
    }
}
