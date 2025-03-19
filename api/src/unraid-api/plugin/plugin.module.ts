import { DynamicModule, Logger, Module, OnModuleInit, Provider, Type } from '@nestjs/common';

import { pascalCase } from 'change-case';

import type { ConstructablePlugin } from '@app/unraid-api/plugin/plugin.interface.js';
import { getPackageJsonDependencies as getPackageDependencies } from '@app/environment.js';
import { store } from '@app/store/index.js';
import { ApiPluginDefinition, apiPluginSchema } from '@app/unraid-api/plugin/plugin.interface.js';
import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';
import { batchProcess } from '@app/utils.js';

type CustomProvider = Provider & {
    provide: string | symbol | Type<any>;
};

@Module({})
export class PluginModule implements OnModuleInit {
    private static readonly logger = new Logger(PluginModule.name);
    constructor(private readonly pluginService: PluginService) {}

    private static isPluginFactory(factory: any): factory is ConstructablePlugin {
        return typeof factory === 'function';
    }

    private static async getPluginFromPackage(pluginPackage: string): Promise<{
        provider: CustomProvider;
        pluginInstance: ApiPluginDefinition;
    }> {
        const moduleImport = await import(/* @vite-ignore */ pluginPackage);
        const pluginName = pascalCase(pluginPackage);
        const PluginFactory = moduleImport.default || moduleImport[pluginName];

        if (!this.isPluginFactory(PluginFactory)) {
            throw new Error(`Invalid plugin from ${pluginPackage}. Must export a factory function.`);
        }

        const logger = new Logger(PluginFactory.name);
        // Note: plugin construction could throw. this should bubble up.
        const validation = apiPluginSchema.safeParse(PluginFactory({ store, logger }));
        if (!validation.success) {
            throw new Error(`Invalid plugin from ${pluginPackage}: ${validation.error}`);
        }
        const pluginInstance = validation.data;

        return {
            provider: {
                provide: PluginFactory.name,
                useValue: pluginInstance,
            },
            pluginInstance,
        };
    }

    static async registerPlugins(): Promise<DynamicModule> {
        /** All api plugins must be npm packages whose name starts with this prefix */
        const pluginPrefix = 'unraid-api-plugin-';
        // All api plugins must be installed as dependencies of the unraid-api package
        /** list of npm packages that are unraid-api plugins */
        const plugins = getPackageDependencies()?.filter((pkgName) => pkgName.startsWith(pluginPrefix));
        if (!plugins) {
            this.logger.warn('Could not load dependencies from the Unraid-API package.json');
            // Fail silently: Return the module without plugins
            return {
                module: PluginModule,
                providers: [PluginService],
                exports: [PluginService],
                global: true,
            };
        }
        const pluginsListing = JSON.stringify(plugins, null, 2);
        this.logger.debug(`Found ${plugins.length} plugins to load: ${pluginsListing}`);

        const failedPlugins: string[] = [];
        const { data: pluginProviders } = await batchProcess(plugins, async (pluginPackage) => {
            try {
                return await this.getPluginFromPackage(pluginPackage);
            } catch (error) {
                failedPlugins.push(pluginPackage);
                this.logger.warn(error);
                throw error;
            }
        });
        if (failedPlugins.length > 0) {
            this.logger.warn(
                `${failedPlugins.length} plugins failed to load. Ignoring them: ${failedPlugins.join(', ')}`
            );
        }

        // Separate providers and instances
        const providers = pluginProviders.map((result) => result.provider);
        // Create the module configuration
        return {
            module: PluginModule,
            providers: [PluginService, ...providers],
            exports: [PluginService, ...providers.map((p) => p.provide)],
            global: true,
        };
    }

    async onModuleInit() {
        // Get all providers except PluginService
        const pluginProviders = Reflect.getMetadata('providers', PluginModule) || [];
        const plugins = pluginProviders
            .filter((provider) => provider.provide !== PluginService)
            .map((provider) => provider.useValue);

        // Register each plugin with the PluginService
        for (const plugin of plugins) {
            this.pluginService.registerPlugin(plugin);
        }

        PluginModule.logger.log('Plugin Module initialized');
    }
}
