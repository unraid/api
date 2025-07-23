import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiConfig } from '@unraid/shared/services/api-config.js';

import { DependencyService } from '@app/unraid-api/app/dependency.service.js';
import { ApiConfigPersistence } from '@app/unraid-api/config/api-config.module.js';

@Injectable()
export class PluginManagementService {
    constructor(
        private readonly configService: ConfigService<{ api: ApiConfig }, true>,
        private readonly dependencyService: DependencyService,
        private readonly apiConfigPersistence: ApiConfigPersistence
    ) {}

    get plugins() {
        return this.configService.get('api.plugins', [], { infer: true });
    }

    async addPlugin(...plugins: string[]) {
        const added = this.addPluginToConfig(...plugins);
        await this.persistConfig();
        await this.installPlugins(...added);
        await this.dependencyService.rebuildVendorArchive();
    }

    async removePlugin(...plugins: string[]) {
        const removed = this.removePluginFromConfig(...plugins);
        await this.persistConfig();
        await this.uninstallPlugins(...removed);
        await this.dependencyService.rebuildVendorArchive();
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
        // @ts-expect-error - This is a valid config key
        this.configService.set<string[]>('api.plugins', Array.from(pluginSet));
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
        // @ts-expect-error - This is a valid config key
        this.configService.set('api.plugins', pluginsArray);
        return removed;
    }

    /**
     * Installs plugins using npm.
     *
     * @param plugins - The plugins to install.
     * @returns The execa result of the npm command.
     */
    private installPlugins(...plugins: string[]) {
        return this.dependencyService.npm('i', '--save-peer', '--save-exact', ...plugins);
    }

    /**
     * Uninstalls plugins using npm.
     *
     * @param plugins - The plugins to uninstall.
     * @returns The execa result of the npm command.
     */
    private uninstallPlugins(...plugins: string[]) {
        return this.dependencyService.npm('uninstall', ...plugins);
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
        await this.persistConfig();
        return added;
    }

    async removeBundledPlugin(...plugins: string[]) {
        const removed = this.removePluginFromConfig(...plugins);
        await this.persistConfig();
        return removed;
    }

    private async persistConfig() {
        return await this.apiConfigPersistence.persist();
    }
}
