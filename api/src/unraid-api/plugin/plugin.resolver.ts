import { Injectable } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import { AuthAction, UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { LifecycleService } from '@app/unraid-api/app/lifecycle.service.js';
import { PluginManagementService } from '@app/unraid-api/plugin/plugin-management.service.js';
import { Plugin, PluginManagementInput } from '@app/unraid-api/plugin/plugin.model.js';
import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';

@Injectable()
@Resolver(() => Plugin)
export class PluginResolver {
    constructor(
        private readonly pluginManagementService: PluginManagementService,
        private readonly lifecycleService: LifecycleService
    ) {}

    @Query(() => [Plugin], { description: 'List all installed plugins with their metadata' })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    async plugins(): Promise<Plugin[]> {
        const plugins = await PluginService.getPlugins();
        return plugins.map((p) => ({
            name: p.name,
            version: p.version,
            hasApiModule: !!p.ApiModule,
            hasCliModule: !!p.CliModule,
        }));
    }

    /**
     * Adds a plugin to the api.
     * @param input
     * @returns boolean indicating whether a separate restart is required. when false, the restart will be triggered automatically.
     */
    @Mutation(() => Boolean, {
        description:
            'Add one or more plugins to the API. Returns false if restart was triggered automatically, true if manual restart is required.',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CONFIG,
    })
    async addPlugin(@Args('input') input: PluginManagementInput): Promise<boolean> {
        if (input.bundled) {
            await this.pluginManagementService.addBundledPlugin(...input.names);
        } else {
            await this.pluginManagementService.addPlugin(...input.names);
        }

        if (input.restart) {
            this.lifecycleService.restartApi({ delayMs: 300 });
            return false;
        }

        return true;
    }

    /**
     * Removes a plugin from the api.
     * @param input
     * @returns boolean indicating whether a separate restart is required. when false, the restart will be triggered automatically.
     */
    @Mutation(() => Boolean, {
        description:
            'Remove one or more plugins from the API. Returns false if restart was triggered automatically, true if manual restart is required.',
    })
    @UsePermissions({
        action: AuthAction.DELETE_ANY,
        resource: Resource.CONFIG,
    })
    async removePlugin(@Args('input') input: PluginManagementInput): Promise<boolean> {
        if (input.bundled) {
            await this.pluginManagementService.removeBundledPlugin(...input.names);
        } else {
            await this.pluginManagementService.removePlugin(...input.names);
        }

        if (input.restart) {
            this.lifecycleService.restartApi({ delayMs: 300 });
            return false;
        }
        return true;
    }
}
