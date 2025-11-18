import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiConfig } from '@unraid/shared/services/api-config.js';

import { DependencyService } from '@app/unraid-api/app/dependency.service.js';

@Injectable()
export class PluginManagementService {
    static WORKSPACE_PACKAGES_TO_VENDOR = ['@unraid/shared', 'unraid-api-plugin-connect'];

    constructor(
        private readonly configService: ConfigService<{ api: ApiConfig }, true>,
        private readonly dependencyService: DependencyService
    ) {}

    get plugins() {
        return this.configService.get('api.plugins', [], { infer: true });
    }

    async addPlugin(...plugins: string[]) {
        const added = this.addPluginToConfig(...plugins);
        await this.installPlugins(...added);
        await this.dependencyService.rebuildVendorArchive();
    }

    isBundled(plugin: string) {
        return PluginManagementService.WORKSPACE_PACKAGES_TO_VENDOR.includes(plugin);
    }

    /**
     * Removes plugins from the config and uninstalls them from node_modules.
     *
     * @param plugins - The npm package names to remove.
     */
    async removePlugin(...plugins: string[]) {
        const removed = this.removePluginFromConfig(...plugins);
        const { unbundledRemoved } = await this.uninstallPlugins(...removed);
        if (unbundledRemoved.length > 0) {
            await this.dependencyService.rebuildVendorArchive();
        }
    }

    /**
     * Adds plugins to the config.
     *
     * @param plugins - The plugins to add.
     * @returns The list of plugins added to the config
     */
    private addPluginToConfig(...plugins: string[]) {
        const pluginSet = new Set(this.plugins);
        const added: string[] = [];
        plugins.forEach((plugin) => {
            if (!pluginSet.has(plugin)) {
                added.push(plugin);
            }
            pluginSet.add(plugin);
        });
        this.updatePluginsConfig(Array.from(pluginSet));
        return added;
    }

    /**
     * Removes plugins from the config.
     *
     * @param plugins - The plugins to remove.
     * @returns The list of plugins removed from the config
     */
    private removePluginFromConfig(...plugins: string[]) {
        const pluginSet = new Set(this.plugins);
        const removed = plugins.filter((plugin) => pluginSet.delete(plugin));
        const pluginsArray = Array.from(pluginSet);
        this.updatePluginsConfig(pluginsArray);
        return removed;
    }

    private updatePluginsConfig(plugins: string[]) {
        const apiConfig = this.configService.get<ApiConfig>('api');
        this.configService.set('api', { ...apiConfig, plugins });
    }

    /**
     * Install bundle / unbundled plugins using npm or direct with the config.
     *
     * @param plugins - The plugins to install.
     * @returns The execa result of the npm command.
     */
    private async installPlugins(...plugins: string[]) {
        const bundled = plugins.filter((plugin) => this.isBundled(plugin));
        const unbundled = plugins.filter((plugin) => !this.isBundled(plugin));
        if (unbundled.length > 0) {
            await this.dependencyService.npm('i', '--save-peer', '--save-exact', ...unbundled);
        }
        if (bundled.length > 0) {
            await this.addBundledPlugin(...bundled);
        }
    }

    /**
     * Uninstalls plugins using npm.
     *
     * @param plugins - The plugins to uninstall.
     * @returns The execa result of the npm command.
     */
    private async uninstallPlugins(...plugins: string[]) {
        const bundled = plugins.filter((plugin) => this.isBundled(plugin));
        const unbundled = plugins.filter((plugin) => !this.isBundled(plugin));

        if (unbundled.length > 0) {
            await this.dependencyService.npm('uninstall', ...unbundled);
        }
        if (bundled.length > 0) {
            await this.removePluginConfigOnly(...bundled);
        }

        return { bundledRemoved: bundled, unbundledRemoved: unbundled };
    }

    /**------------------------------------------------------------------------
     *                           Bundled Plugins
     * Plugins that are not published to npm, but vendored as tarballs in the
     *  `/usr/local/unraid-api/packages` directory.
     *
     * We don't know their versions ahead of time, so for simplicity, they
     * are installed to node_modules at build time and are never un/installed.
     *
     * We use the `api.plugins` config setting to control whether these plugins
     * are loaded/enabled at runtime.
     *------------------------------------------------------------------------**/

    async addBundledPlugin(...plugins: string[]) {
        const added = this.addPluginToConfig(...plugins);
        return added;
    }

    /**
     * Removes plugins from the config without touching npm (used for bundled/default bypass flow).
     *
     * @param plugins - The plugins to remove.
     * @returns The list of plugins removed from the config.
     */
    async removePluginConfigOnly(...plugins: string[]) {
        const removed = this.removePluginFromConfig(...plugins);
        return removed;
    }
}
