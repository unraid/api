import { Injectable } from '@nestjs/common';

import type { ApiNestPluginDefinition } from '@app/unraid-api/plugin/plugin.interface.js';
import { pluginLogger } from '@app/core/log.js';
import { fileExists } from '@app/core/utils/files/file-exists.js';
import { getPackageJson } from '@app/environment.js';
import { loadApiConfig } from '@app/unraid-api/config/api-config.module.js';
import { NotificationImportance } from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';
import { apiNestPluginSchema } from '@app/unraid-api/plugin/plugin.interface.js';
import { batchProcess, parsePackageArg } from '@app/utils.js';

type Plugin = ApiNestPluginDefinition & {
    name: string;
    version: string;
};

const CONNECT_PLUGIN_PACKAGE = 'unraid-api-plugin-connect';
const CONNECT_PLUGIN_LOCATIONS = [
    '/boot/config/plugins/dynamix.unraid.net.plg',
    '/boot/config/plugins/dynamix.unraid.net.staging.plg',
];

@Injectable()
export class PluginService {
    private static readonly logger = pluginLogger;
    private static plugins: Promise<Plugin[]> | undefined;

    static async getPlugins() {
        PluginService.plugins ??= PluginService.importPlugins();
        return PluginService.plugins;
    }

    private static async importPlugins() {
        if (PluginService.plugins) {
            return PluginService.plugins;
        }
        const pluginPackages = await PluginService.listPlugins();
        const plugins = await batchProcess(pluginPackages, async ([pkgName, version]) => {
            try {
                const plugin = await import(/* @vite-ignore */ pkgName);
                const parsedPlugin = apiNestPluginSchema.parse(plugin);
                return {
                    ...parsedPlugin,
                    name: pkgName,
                    version,
                };
            } catch (error) {
                PluginService.logger.error(`Plugin from ${pkgName} is invalid: %o`, error as object);
                const notificationService = new NotificationsService();
                const errorMessage = error?.toString?.() ?? (error as Error)?.message ?? '';
                await notificationService.createNotification({
                    title: `Plugin from ${pkgName} is invalid`,
                    subject: `API Plugins`,
                    description:
                        'Please see /var/log/graphql-api.log for more details.\n' + errorMessage,
                    importance: NotificationImportance.ALERT,
                });
                throw error;
            }
        });

        if (plugins.errorOccurred) {
            PluginService.logger.warn(`Failed to load ${plugins.errors.length} plugins. Ignoring them.`);
        }
        return plugins.data;
    }

    /**
     * Lists all plugins that are installed as peer dependencies of the unraid-api package.
     *
     * @returns A tuple of the plugin name and version.
     */
    static async listPlugins(): Promise<[string, string][]> {
        let plugins: string[] = [];
        try {
            const config = await loadApiConfig();
            plugins = config.plugins || [];
        } catch (error) {
            PluginService.logger.error(
                'Failed to load API config for plugin discovery, using empty list: %o',
                error as object
            );
        }
        const pluginNames = new Set(
            plugins.map((plugin) => {
                const { name } = parsePackageArg(plugin);
                return name;
            })
        );
        const { peerDependencies } = getPackageJson();
        // All api plugins must be installed as peer dependencies of the unraid-api package
        if (!peerDependencies) {
            PluginService.logger.warn('Unraid-API peer dependencies not found; skipping plugins.');
            return [];
        }
        let pluginTuples = Object.entries(peerDependencies).filter(
            (entry): entry is [string, string] => {
                const [pkgName, version] = entry;
                return pluginNames.has(pkgName) && typeof version === 'string';
            }
        );

        if (pluginTuples.some(([pkgName]) => pkgName === CONNECT_PLUGIN_PACKAGE)) {
            const connectPluginInstalled = await PluginService.isConnectPluginInstalled();
            if (!connectPluginInstalled) {
                PluginService.logger.warn(
                    `Connect plugin not detected on disk. Skipping ${CONNECT_PLUGIN_PACKAGE}.`
                );
                pluginTuples = pluginTuples.filter(([pkgName]) => pkgName !== CONNECT_PLUGIN_PACKAGE);
            }
        }

        return pluginTuples;
    }

    private static async isConnectPluginInstalled(): Promise<boolean> {
        for (const path of CONNECT_PLUGIN_LOCATIONS) {
            try {
                if (await fileExists(path)) {
                    return true;
                }
            } catch (error) {
                PluginService.logger.debug(
                    `Error while checking connect plugin path ${path}: %o`,
                    error as object
                );
            }
        }
        return false;
    }
}
