import { DynamicModule, Logger, Module, OnModuleInit, Provider, Type } from '@nestjs/common';
import { readdir } from 'fs/promises';
import path, { join } from 'path';

import { ENVIRONMENT } from '@app/environment.js';
import { store } from '@app/store/index.js';

import { UnraidAPIPlugin } from './plugin.interface.js';
import { PluginService } from './plugin.service.js';

type CustomProvider = Provider & {
    provide: string | symbol | Type<any>;
};

@Module({})
export class PluginModule implements OnModuleInit {
    constructor(private readonly pluginService: PluginService) {}

    private static isValidPlugin(plugin: any): plugin is typeof UnraidAPIPlugin {
        return typeof plugin === 'function' && plugin.prototype instanceof UnraidAPIPlugin;
    }

    private static async processPluginFolder(pluginPath: string): Promise<{
        provider: CustomProvider;
        pluginInstance: UnraidAPIPlugin;
    }> {
        const folderName = path.basename(pluginPath);
        const modulePath = join(
            pluginPath,
            'api',
            ENVIRONMENT === 'development' ? 'index.ts' : 'index.js'
        );

        try {
            const moduleImport = await import(modulePath);
            const ModuleClass = moduleImport.default || moduleImport[`${folderName}Module`];

            if (!ModuleClass || !this.isValidPlugin(ModuleClass)) {
                throw new Error(
                    `Invalid plugin in ${modulePath}. Must implement UnraidPlugin interface`
                );
            }

            if (ModuleClass === UnraidAPIPlugin) {
                throw new Error(
                    `${folderName} must be a concrete implementation, not the abstract UnraidAPIPlugin class`
                );
            }

            const logger = new Logger(folderName);
            const pluginInstance = new (ModuleClass as unknown as new (options: {
                store: any;
                logger: Logger;
            }) => UnraidAPIPlugin)({ store, logger });

            const provider: CustomProvider = {
                provide: folderName,
                useValue: pluginInstance,
            };

            return {
                provider,
                pluginInstance,
            };
        } catch (error) {
            console.error(`Failed to load plugin ${folderName}:`, error);
            throw error;
        }
    }

    static async registerPlugins(): Promise<DynamicModule> {
        /**
         * @todo Please eventually move plugins to independent node modules.
         * This was skipped due to time constraints.
         */
        const pluginsPath = path.join(import.meta.dirname, '../plugins');

        let allPlugins: any[] = [];
        try {
            allPlugins = await readdir(pluginsPath, { withFileTypes: true });
        } catch (error) {
            // Directory doesn't exist or can't be read, log and continue with empty plugins
            console.log(`No plugins directory found at ${pluginsPath}`);
        }

        const pluginResults = await Promise.all(
            allPlugins
                .filter((dirent) => dirent.isDirectory())
                .map((dir) => this.processPluginFolder(join(pluginsPath, dir.name)))
        );

        // Separate providers and instances
        const providers = pluginResults.map((result) => result.provider);

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

        console.log('Plugin Module initialized');
    }
}
