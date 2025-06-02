import { Injectable, Logger } from '@nestjs/common';

import type { ApiNestPluginDefinition } from '@app/unraid-api/plugin/plugin.interface.js';
import { getPackageJson } from '@app/environment.js';
import {
    NotificationImportance,
    NotificationType,
} from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';
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
                    // `../plugins/${pkgName}/index.js`,
                ];
                const plugin = await Promise.any(
                    possibleImportSources.map((source) => import(/* @vite-ignore */ source))
                );
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

    static async listPlugins(): Promise<[string, string][]> {
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
