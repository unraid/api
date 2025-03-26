import { DynamicModule, Logger, Module } from '@nestjs/common';

import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';

@Module({})
export class PluginModule {
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
}
