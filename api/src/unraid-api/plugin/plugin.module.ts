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

    static async registerPlugins(): Promise<DynamicModule> {
        const plugins = await PluginService.getPlugins();
        const providers = plugins.map((result) => result.provider);
        return {
            module: PluginModule,
            providers: [PluginService, ...providers],
            exports: [PluginService, ...providers.map((p) => p.provide)],
            global: true,
        };
    }

    async onModuleInit() {
        // Get all providers except PluginService
        // const pluginProviders = Reflect.getMetadata('providers', PluginModule) || [];
        // console.log('pluginProviders', pluginProviders);
        // const plugins = pluginProviders
        //     .filter((provider) => provider.provide !== PluginService)
        //     .map((provider) => provider.useValue);

        // console.log('new plugins', plugins);

        // // Register each plugin with the PluginService
        // for (const plugin of plugins) {
        //     this.pluginService.registerPlugin(plugin);
        // }

        // PluginModule.logger.log('Plugin Module initialized');
    }
}
