import { Injectable, Logger, Provider, Type } from '@nestjs/common';

import { pascalCase } from 'change-case';

import type {
    ApiPluginDefinition,
    ConstructablePlugin,
} from '@app/unraid-api/plugin/plugin.interface.js';
import { getPackageJsonDependencies as getPackageDependencies } from '@app/environment.js';
import { store } from '@app/store/index.js';
import { apiPluginSchema } from '@app/unraid-api/plugin/plugin.interface.js';
import { batchProcess } from '@app/utils.js';

type CustomProvider = Provider & {
    provide: string | symbol | Type<any>;
};

type PluginProvider = {
    provider: CustomProvider;
    pluginInstance: ApiPluginDefinition;
};

@Injectable()
export class PluginService {
    private pluginProviders: PluginProvider[] | undefined;
    private loadingPromise: Promise<PluginProvider[]> | undefined;
    private static readonly logger = new Logger(PluginService.name);
    constructor() {
        this.loadPlugins();
    }

    private get plugins() {
        return this.pluginProviders?.map((plugin) => plugin.pluginInstance) ?? [];
    }

    async loadPlugins() {
        // If plugins are already loaded, return them
        if (this.pluginProviders?.length) {
            return this.pluginProviders;
        }

        // If getPlugins() is already loading, return its promise
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = PluginService.getPlugins()
            .then((plugins) => {
                if (!this.pluginProviders?.length) {
                    this.pluginProviders = plugins;
                    const pluginNames = this.plugins.map((plugin) => plugin.name);
                    PluginService.logger.debug(
                        `Registered ${pluginNames.length} plugins: ${pluginNames.join(', ')}`
                    );
                } else {
                    PluginService.logger.debug(
                        `${plugins.length} plugins already registered. Skipping registration.`
                    );
                }
                return this.pluginProviders;
            })
            .catch((error) => {
                PluginService.logger.error('Error registering plugins', error);
                return [];
            })
            .finally(() => {
                // clear loading state
                this.loadingPromise = undefined;
            });

        return this.loadingPromise;
    }

    private static isPluginFactory(factory: any): factory is ConstructablePlugin {
        return typeof factory === 'function';
    }

    private static async getPluginFromPackage(pluginPackage: string): Promise<{
        provider: CustomProvider;
        pluginInstance: ApiPluginDefinition;
    }> {
        const moduleImport = await import(/* @vite-ignore */ pluginPackage);
        const pluginName = pascalCase(pluginPackage);
        const PluginFactory = moduleImport.default || moduleImport[pluginName];

        if (!PluginService.isPluginFactory(PluginFactory)) {
            throw new Error(`Invalid plugin from ${pluginPackage}. Must export a factory function.`);
        }

        const logger = new Logger(PluginFactory.name);
        const validation = apiPluginSchema.safeParse(PluginFactory({ store, logger }));
        if (!validation.success) {
            throw new Error(`Invalid plugin from ${pluginPackage}: ${validation.error}`);
        }
        const pluginInstance = validation.data;

        return {
            provider: {
                provide: PluginFactory.name,
                useValue: pluginInstance,
            },
            pluginInstance,
        };
    }

    static async getPlugins() {
        /** All api plugins must be npm packages whose name starts with this prefix */
        const pluginPrefix = 'unraid-api-plugin-';
        // All api plugins must be installed as dependencies of the unraid-api package
        /** list of npm packages that are unraid-api plugins */
        const plugins = getPackageDependencies()?.filter((pkgName) => pkgName.startsWith(pluginPrefix));
        if (!plugins) {
            PluginService.logger.warn('Could not load dependencies from the Unraid-API package.json');
            // Fail silently: Return the module without plugins
            return [];
        }

        const failedPlugins: string[] = [];
        const { data: pluginProviders } = await batchProcess(plugins, async (pluginPackage) => {
            try {
                return await PluginService.getPluginFromPackage(pluginPackage);
            } catch (error) {
                failedPlugins.push(pluginPackage);
                PluginService.logger.warn(error);
                throw error;
            }
        });
        if (failedPlugins.length > 0) {
            PluginService.logger.warn(
                `${failedPlugins.length} plugins failed to load. Ignoring them: ${failedPlugins.join(', ')}`
            );
        }

        return pluginProviders;
    }

    async getGraphQLConfiguration() {
        await this.loadPlugins();
        const plugins = this.plugins;

        let combinedResolvers = {};
        const typeDefs: string[] = [];

        for (const plugin of plugins) {
            if (plugin.registerGraphQLResolvers) {
                const pluginResolvers = await plugin.registerGraphQLResolvers();
                combinedResolvers = {
                    ...combinedResolvers,
                    ...pluginResolvers,
                };
            }

            if (plugin.registerGraphQLTypeDefs) {
                const pluginTypeDefs = await plugin.registerGraphQLTypeDefs();
                if (pluginTypeDefs) {
                    typeDefs.push(pluginTypeDefs);
                } else {
                    const errorMessage = `Plugin ${plugin.name} returned an unusable GraphQL type definition: ${JSON.stringify(
                        pluginTypeDefs
                    )}`;
                    PluginService.logger.warn(errorMessage);
                }
            }
        }

        return {
            resolvers: combinedResolvers,
            typeDefs: typeDefs.join('\n'),
        };
    }

    async getRESTConfiguration() {
        await this.loadPlugins();
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
        await this.loadPlugins();
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
        await this.loadPlugins();
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
