import { DynamicModule, Logger, Module } from '@nestjs/common';

import { DependencyService } from '@app/unraid-api/app/dependency.service.js';
import { ResolversModule } from '@app/unraid-api/graph/resolvers/resolvers.module.js';
import { GlobalDepsModule } from '@app/unraid-api/plugin/global-deps.module.js';
import { PluginManagementService } from '@app/unraid-api/plugin/plugin-management.service.js';
import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';

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
            imports: [GlobalDepsModule, ResolversModule, ...apiModules],
            providers: [PluginService, PluginManagementService, DependencyService],
            exports: [PluginService, PluginManagementService, DependencyService, GlobalDepsModule],
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
            imports: [GlobalDepsModule, ...cliModules],
            providers: [PluginManagementService, DependencyService],
            exports: [PluginManagementService, DependencyService, GlobalDepsModule],
        };
    }
}
