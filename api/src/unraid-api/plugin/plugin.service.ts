import { Injectable, Logger } from '@nestjs/common';

import type { ApiNestPluginDefinition } from '@app/unraid-api/plugin/plugin.interface.js';
import { getPackageJson } from '@app/environment.js';
import { loadApiConfig } from '@app/unraid-api/config/api-config.module.js';
import {
    NotificationImportance,
    NotificationType,
} from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';
import { apiNestPluginSchema } from '@app/unraid-api/plugin/plugin.interface.js';
import { batchProcess, parsePackageArg } from '@app/utils.js';

@Injectable()
export class PluginService {
    private static readonly logger = new Logger(PluginService.name);
    private static plugins: Promise<ApiNestPluginDefinition[]> | undefined;

    static async getPlugins() {
        PluginService.plugins ??= PluginService.importPlugins();
        return PluginService.plugins;
    }

    private static async importPlugins() {
        if (PluginService.plugins) {
            return PluginService.plugins;
        }
        const pluginPackages = await PluginService.listPlugins();
        const plugins = await batchProcess(pluginPackages, async ([pkgName]) => {
            try {
                const plugin = await import(/* @vite-ignore */ pkgName);
                return apiNestPluginSchema.parse(plugin);
            } catch (error) {
                PluginService.logger.error(`Plugin from ${pkgName} is invalid`, error);
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

        if (plugins.errorOccured) {
            PluginService.logger.warn(`Failed to load ${plugins.errors.length} plugins. Ignoring them.`);
        }
        PluginService.logger.log(`Loaded ${plugins.data.length} plugins.`);
        return plugins.data;
    }

    /**
     * Lists all plugins that are installed as peer dependencies of the unraid-api package.
     *
     * @returns A tuple of the plugin name and version.
     */
    static async listPlugins(): Promise<[string, string][]> {
        const { plugins } = await loadApiConfig();
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
        const pluginTuples = Object.entries(peerDependencies).filter(
            (entry): entry is [string, string] => {
                const [pkgName, version] = entry;
                return pluginNames.has(pkgName) && typeof version === 'string';
            }
        );
        return pluginTuples;
    }
}
