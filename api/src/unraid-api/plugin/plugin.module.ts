import { DynamicModule, Logger, Module } from '@nestjs/common';

import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';

@Module({})
export class PluginModule {
    private static readonly logger = new Logger(PluginModule.name);
    constructor(private readonly pluginService: PluginService) {}

    static async register(): Promise<DynamicModule> {
        const plugins = await PluginService.getPlugins();
        const apiModules = plugins
            .filter((plugin) => plugin.ApiModule)
            .map((plugin) => plugin.ApiModule!);

        const pluginList = apiModules.map((plugin) => plugin.name).join(', ');
        PluginModule.logger.log(`Found ${apiModules.length} API plugins: ${pluginList}`);

        return {
            module: PluginModule,
            imports: [...apiModules],
            providers: [PluginService],
            exports: [PluginService],
            global: true,
        };
    }
}

@Module({})
export class PluginCliModule {
    private static readonly logger = new Logger(PluginCliModule.name);

    static async register(): Promise<DynamicModule> {
        const plugins = await PluginService.getPlugins();
        const cliModules = plugins
            .filter((plugin) => plugin.CliModule)
            .map((plugin) => plugin.CliModule!);

        const cliList = cliModules.map((plugin) => plugin.name).join(', ');
        PluginCliModule.logger.debug(`Found ${cliModules.length} CLI plugins: ${cliList}`);

        return {
            module: PluginCliModule,
            imports: [...cliModules],
        };
    }
}
