import { DynamicModule, Logger, Module, OnModuleInit, Provider, Type } from '@nestjs/common';

import { pascalCase } from 'change-case';

import type { ConstructablePlugin } from '@app/unraid-api/plugin/plugin.interface.js';
import { getPackageJsonDependencies as getPackageDependencies } from '@app/environment.js';
import { store } from '@app/store/index.js';
import { UnraidAPIPlugin } from '@app/unraid-api/plugin/plugin.interface.js';
import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';
import { batchProcess } from '@app/utils.js';

type CustomProvider = Provider & {
    provide: string | symbol | Type<any>;
};

@Module({})
export class PluginModule implements OnModuleInit {
    private static readonly logger = new Logger(PluginModule.name);
    constructor(private readonly pluginService: PluginService) {}

    private static isValidPlugin(plugin: any): plugin is ConstructablePlugin {
        return typeof plugin === 'function' && plugin.prototype instanceof UnraidAPIPlugin;
    }

    private static async getPluginFromPackage(pluginPackage: string): Promise<{
        provider: CustomProvider;
        pluginInstance: UnraidAPIPlugin;
    }> {
        const moduleImport = await import(/* @vite-ignore */ pluginPackage);
        const pluginName = pascalCase(pluginPackage);
        const ModuleClass = moduleImport.default || moduleImport[pluginName];

        if (!this.isValidPlugin(ModuleClass)) {
            throw new Error(
                `Invalid plugin from ${pluginPackage}. Must implement UnraidApiPlugin interface.`
            );
        }

        const logger = new Logger(ModuleClass.name);
        const pluginInstance = new ModuleClass({ store, logger });
        const provider: CustomProvider = {
            provide: ModuleClass.name,
            useValue: pluginInstance,
        };

        return {
            provider,
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
        this.logger.debug(
            `Found ${plugins.length} plugins to load: ${JSON.stringify(plugins, null, 2)}`
        );

        const { data: pluginProviders, errors } = await batchProcess(plugins, async (pluginPackage) => {
            return this.getPluginFromPackage(pluginPackage);
        });
        errors.forEach((error) => {
            this.logger.warn(error?.message ?? error);
        });

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
            .map((provider) => provider.useValue)
            .filter((plugin): plugin is UnraidAPIPlugin => plugin instanceof UnraidAPIPlugin);

        // Register each plugin with the PluginService
        for (const plugin of plugins) {
            this.pluginService.registerPlugin(plugin);
        }

        PluginModule.logger.log('Plugin Module initialized');
    }
}
