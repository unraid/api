import { Injectable, Logger, Type } from '@nestjs/common';

import type { ApiPluginDefinition } from '@app/unraid-api/plugin/plugin.interface.js';

@Injectable()
export class PluginService {
    private readonly plugins: ApiPluginDefinition[] = [];
    private readonly logger = new Logger(PluginService.name);

    registerPlugin(plugin: ApiPluginDefinition) {
        this.plugins.push(plugin);
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
