import { DynamicModule, Logger, Module } from '@nestjs/common';

import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';
import { upnpClient } from '@app/upnp/helpers.js';

export const UPNP_CLIENT_TOKEN = 'UPNP_CLIENT';

@Module({})
export class PluginModule {
    private static readonly logger = new Logger(PluginModule.name);

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
            providers: [
                PluginService,
                {
                    provide: UPNP_CLIENT_TOKEN,
                    useValue: upnpClient,
                },
            ],
            exports: [PluginService, UPNP_CLIENT_TOKEN],
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
