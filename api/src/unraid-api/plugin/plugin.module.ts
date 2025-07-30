import { DynamicModule, Module } from '@nestjs/common';

import { DependencyService } from '@app/unraid-api/app/dependency.service.js';
import { ApiConfigModule } from '@app/unraid-api/config/api-config.module.js';
import { ResolversModule } from '@app/unraid-api/graph/resolvers/resolvers.module.js';
import { GlobalDepsModule } from '@app/unraid-api/plugin/global-deps.module.js';
import { PluginManagementService } from '@app/unraid-api/plugin/plugin-management.service.js';
import { PluginResolver } from '@app/unraid-api/plugin/plugin.resolver.js';
import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';

@Module({})
export class PluginModule {
    private static apiList: string[];

    async onApplicationBootstrap() {
        const { Logger } = await import('@nestjs/common');
        const logger = new Logger(PluginModule.name);
        logger.debug(
            `Found ${PluginModule.apiList.length} API plugins: ${PluginModule.apiList.join(', ')}`
        );
    }

    static async register(): Promise<DynamicModule> {
        const plugins = await PluginService.getPlugins();
        const apiModules = plugins
            .filter((plugin) => plugin.ApiModule)
            .map((plugin) => plugin.ApiModule!);

        PluginModule.apiList = apiModules.map((plugin) => plugin.name);
        return {
            module: PluginModule,
            imports: [GlobalDepsModule, ResolversModule, ApiConfigModule, ...apiModules],
            providers: [PluginService, PluginManagementService, DependencyService, PluginResolver],
            exports: [PluginService, PluginManagementService, DependencyService, GlobalDepsModule],
        };
    }
}

@Module({})
export class PluginCliModule {
    private static cliList: string[];

    async onApplicationBootstrap() {
        const { Logger } = await import('@nestjs/common');
        const logger = new Logger(PluginCliModule.name);
        logger.debug(
            `Found ${PluginCliModule.cliList.length} CLI plugins: ${PluginCliModule.cliList.join(', ')}`
        );
    }

    static async register(): Promise<DynamicModule> {
        const plugins = await PluginService.getPlugins();
        const cliModules = plugins
            .filter((plugin) => plugin.CliModule)
            .map((plugin) => plugin.CliModule!);

        PluginCliModule.cliList = cliModules.map((plugin) => plugin.name);
        return {
            module: PluginCliModule,
            imports: [GlobalDepsModule, ApiConfigModule, ...cliModules],
            providers: [PluginManagementService, DependencyService],
            exports: [PluginManagementService, DependencyService, GlobalDepsModule],
        };
    }
}
