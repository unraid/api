import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Type } from '@nestjs/common';
import { UnraidAPIPlugin } from './plugin.interface.js';

@Injectable()
export class PluginService implements OnModuleInit, OnModuleDestroy {
    private readonly plugins: UnraidAPIPlugin[] = [];
    private readonly logger = new Logger(PluginService.name);

    registerPlugin(plugin: UnraidAPIPlugin) {
        this.plugins.push(plugin);
    }

    async onModuleInit() {
        for (const plugin of this.plugins) {
            await plugin.onModuleInit();
            this.logger.log(`Initialized plugin: ${plugin.metadata.name}`);
        }
    }

    async onModuleDestroy() {
        for (const plugin of this.plugins) {
            await plugin.onModuleDestroy();
            this.logger.log(`Destroyed plugin: ${plugin.metadata.name}`);
        }
    }

    async getGraphQLConfiguration() {
        const resolvers: Record<string, any>[] = [];
        const typeDefs: string[] = [];

        for (const plugin of this.plugins) {
            if (plugin.registerGraphQLResolvers) {
                const pluginResolvers = await plugin.registerGraphQLResolvers();
                resolvers.push(...pluginResolvers);
            }

            if (plugin.registerGraphQLTypeDefs) {
                const pluginTypeDefs = await plugin.registerGraphQLTypeDefs();
                typeDefs.push(pluginTypeDefs);
            }
        }

        return {
            resolvers,
            typeDefs: typeDefs.join('\n'),
        };
    }

    async getRESTConfiguration() {
        const controllers: Type<any>[] = [];
        const routes: Record<string, any>[] = [];

        for (const plugin of this.plugins) {
            if (plugin.registerRESTControllers) {
                const pluginControllers = await plugin.registerRESTControllers();
                controllers.push(...pluginControllers);
            }

            if (plugin.registerRESTRoutes) {
                const pluginRoutes = await plugin.registerRESTRoutes();
                routes.push(...pluginRoutes);
            }
        }

        return {
            controllers,
            routes,
        };
    }

    async getServices() {
        const services: Type<any>[] = [];

        for (const plugin of this.plugins) {
            if (plugin.registerServices) {
                const pluginServices = await plugin.registerServices();
                services.push(...pluginServices);
            }
        }

        return services;
    }

    async getCronJobs() {
        const cronJobs: Record<string, any>[] = [];

        for (const plugin of this.plugins) {
            if (plugin.registerCronJobs) {
                const pluginCronJobs = await plugin.registerCronJobs();
                cronJobs.push(...pluginCronJobs);
            }
        }

        return cronJobs;
    }
}
