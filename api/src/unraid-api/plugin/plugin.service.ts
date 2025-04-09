import { Injectable, Logger } from '@nestjs/common';

import type { SetRequired } from 'type-fest';
import { parse } from 'graphql';

import type { ApiNestPluginDefinition } from '@app/unraid-api/plugin/plugin.interface.js';
import { getPackageJson } from '@app/environment.js';
import { apiNestPluginSchema } from '@app/unraid-api/plugin/plugin.interface.js';
import { batchProcess } from '@app/utils.js';

@Injectable()
export class PluginService {
    private static readonly logger = new Logger(PluginService.name);
    private static plugins: Promise<ApiNestPluginDefinition[]> | undefined;

    static async getPlugins() {
        PluginService.plugins ??= PluginService.importPlugins();
        return PluginService.plugins;
    }

    static async getGraphQLSchemas() {
        const plugins = (await PluginService.getPlugins()).filter(
            (plugin): plugin is SetRequired<ApiNestPluginDefinition, 'graphqlSchemaExtension'> =>
                plugin.graphqlSchemaExtension !== undefined
        );
        const { data: schemas } = await batchProcess(plugins, async (plugin) => {
            try {
                const schema = await plugin.graphqlSchemaExtension();
                // Validate schema by parsing it - this will throw if invalid
                parse(schema);
                return schema;
            } catch (error) {
                // we can safely assert ApiModule's presence since we validate the plugin schema upon importing it.
                // ApiModule must be defined when graphqlSchemaExtension is defined.
                PluginService.logger.error(
                    `Error parsing GraphQL schema from ${plugin.ApiModule!.name}: ${JSON.stringify(error, null, 2)}`
                );
                throw error;
            }
        });
        return schemas;
    }

    private static async importPlugins() {
        if (PluginService.plugins) {
            return PluginService.plugins;
        }
        const pluginPackages = await PluginService.listPlugins();
        const plugins = await batchProcess(pluginPackages, async ([pkgName]) => {
            try {
                const possibleImportSources = [
                    pkgName,
                    /**----------------------------------------------
                     *     Importing private workspace plugins
                     *
                     *  Private workspace packages are not available in production,
                     *  so we bundle and copy them to a plugins folder instead.
                     *
                     *  See scripts/copy-plugins.js for more details.
                     *---------------------------------------------**/
                    `../plugins/${pkgName}/index.js`,
                ];
                const plugin = await Promise.any(
                    possibleImportSources.map((source) => import(/* @vite-ignore */ source))
                );
                return apiNestPluginSchema.parse(plugin);
            } catch (error) {
                PluginService.logger.error(`Plugin from ${pkgName} is invalid`, error);
                throw error;
            }
        });

        if (plugins.errorOccured) {
            PluginService.logger.warn(`Failed to load ${plugins.errors.length} plugins. Ignoring them.`);
        }
        PluginService.logger.log(`Loaded ${plugins.data.length} plugins.`);
        return plugins.data;
    }

    private static async listPlugins(): Promise<[string, string][]> {
        /** All api plugins must be npm packages whose name starts with this prefix */
        const pluginPrefix = 'unraid-api-plugin-';
        // All api plugins must be installed as dependencies of the unraid-api package
        const { peerDependencies } = getPackageJson();
        if (!peerDependencies) {
            PluginService.logger.warn('Unraid-API peer dependencies not found; skipping plugins.');
            return [];
        }
        const plugins = Object.entries(peerDependencies).filter((entry): entry is [string, string] => {
            const [pkgName, version] = entry;
            return pkgName.startsWith(pluginPrefix) && typeof version === 'string';
        });
        return plugins;
    }
}
