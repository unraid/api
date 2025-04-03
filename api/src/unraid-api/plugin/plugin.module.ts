import { DynamicModule, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';

@Module({})
export class PluginModule {
    private static readonly logger = new Logger(PluginModule.name);
    constructor(private readonly pluginService: PluginService) {}

    static async registerPlugins(): Promise<DynamicModule> {
        // const plugins = await PluginService.getPlugins();
        // const providers = plugins.map((result) => result.provider);
        const ConnectPluginModule = await import('unraid-api-plugin-connect').then((m) => m.default);
        // const connectModuleConfig = ConnectPluginModule.register();

        return {
            module: PluginModule,
            imports: [ConnectPluginModule],
            providers: [PluginService],
            exports: [PluginService],
            // providers: [PluginService, ...providers],
            // exports: [PluginService, ...providers.map((p) => p.provide)],
            global: true,
        };
    }
}
