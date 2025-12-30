import { Args, ID, Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import {
    PluginInstallEvent,
    PluginInstallOperation,
} from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.model.js';
import { UnraidPluginsService } from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.service.js';

@Resolver()
export class UnraidPluginsResolver {
    constructor(private readonly pluginsService: UnraidPluginsService) {}

    @Query(() => PluginInstallOperation, {
        nullable: true,
        description: 'Retrieve a plugin installation operation by identifier',
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    async pluginInstallOperation(
        @Args('operationId', { type: () => ID }) operationId: string
    ): Promise<PluginInstallOperation | null> {
        return this.pluginsService.getOperation(operationId);
    }

    @Query(() => [PluginInstallOperation], {
        description: 'List all tracked plugin installation operations',
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    async pluginInstallOperations(): Promise<PluginInstallOperation[]> {
        return this.pluginsService.listOperations();
    }

    @Query(() => [String], {
        description: 'List installed Unraid OS plugins by .plg filename',
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    async installedUnraidPlugins(): Promise<string[]> {
        return this.pluginsService.listInstalledPlugins();
    }

    @Subscription(() => PluginInstallEvent, {
        name: 'pluginInstallUpdates',
        resolve: (payload: { pluginInstallUpdates: PluginInstallEvent }) => payload.pluginInstallUpdates,
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    pluginInstallUpdates(
        @Args('operationId', { type: () => ID }) operationId: string
    ): AsyncIterableIterator<{ pluginInstallUpdates: PluginInstallEvent }> {
        return this.pluginsService.subscribe(operationId);
    }
}
