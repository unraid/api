import type { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { NoUnusedVariablesRule, print } from 'graphql';
import {
    DateTimeResolver,
    JSONResolver,
    PortResolver,
    URLResolver,
    UUIDResolver,
} from 'graphql-scalars';

import { GraphQLLong } from '@app/graphql/resolvers/graphql-type-long.js';
import { loadTypeDefs } from '@app/graphql/schema/loadTypesDefs.js';
import { getters } from '@app/store/index.js';
import {
    authSchemaTransformer,
    getAuthEnumTypeDefs,
    transformResolvers,
} from '@app/unraid-api/graph/directives/auth.directive.js';
import { idPrefixPlugin } from '@app/unraid-api/graph/id-prefix-plugin.js';
import { ResolversModule } from '@app/unraid-api/graph/resolvers/resolvers.module.js';
import { sandboxPlugin } from '@app/unraid-api/graph/sandbox-plugin.js';
import { PluginModule } from '@app/unraid-api/plugin/plugin.module.js';
import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';

@Module({
    imports: [
        ResolversModule,
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
            driver: ApolloDriver,
            imports: [PluginModule],
            inject: [PluginService],
            useFactory: async (pluginService: PluginService) => {
                const plugins = await pluginService.getGraphQLConfiguration();
                const authEnumTypeDefs = getAuthEnumTypeDefs();
                const typeDefs = print(await loadTypeDefs([plugins.typeDefs, authEnumTypeDefs]));
                const resolvers = {
                    DateTime: DateTimeResolver,
                    JSON: JSONResolver,
                    Long: GraphQLLong,
                    Port: PortResolver,
                    URL: URLResolver,
                    UUID: UUIDResolver,
                    ...plugins.resolvers,
                };

                return {
                    introspection: getters.config()?.local?.sandbox === 'yes',
                    playground: false,
                    context: ({ req, connectionParams, extra }: any) => ({
                        req,
                        connectionParams,
                        extra,
                    }),
                    plugins: [sandboxPlugin, idPrefixPlugin] as any[],
                    subscriptions: {
                        'graphql-ws': {
                            path: '/graphql',
                        },
                    },
                    typeDefs, // Use string format typeDefs
                    resolvers, // Use original resolvers
                    transformAutoSchemaFile: true,
                    transformResolvers: (resolvers) => transformResolvers(resolvers),
                    transformSchema: (schema) => authSchemaTransformer(schema),
                    validationRules: [NoUnusedVariablesRule],
                };
            },
        }),
    ],
    providers: [],
    exports: [GraphQLModule],
})
export class GraphModule {}
