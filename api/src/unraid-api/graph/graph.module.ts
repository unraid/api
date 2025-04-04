import type { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import { Module, UnauthorizedException } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { ApolloServerPlugin } from '@apollo/server';
import { NoUnusedVariablesRule, print } from 'graphql';
import {
    DateTimeResolver,
    JSONResolver,
    PortResolver,
    URLResolver,
    UUIDResolver,
} from 'graphql-scalars';
import { AuthZService } from 'nest-authz';

import { GraphQLLong } from '@app/graphql/resolvers/graphql-type-long.js';
import { loadTypeDefs } from '@app/graphql/schema/loadTypesDefs.js';
import { getters } from '@app/store/index.js';
import { AuthModule } from '@app/unraid-api/auth/auth.module.js';
import { idPrefixPlugin } from '@app/unraid-api/graph/id-prefix-plugin.js';
import { ResolversModule } from '@app/unraid-api/graph/resolvers/resolvers.module.js';
import { sandboxPlugin } from '@app/unraid-api/graph/sandbox-plugin.js';
import { getAuthEnumTypeDefs } from '@app/unraid-api/graph/utils/auth-enum.utils.js';
import { PluginModule } from '@app/unraid-api/plugin/plugin.module.js';
import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';

@Module({
    imports: [
        ResolversModule,
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
            driver: ApolloDriver,
            imports: [PluginModule, AuthModule],
            inject: [PluginService, AuthZService],
            useFactory: async (pluginService: PluginService, authZService: AuthZService) => {
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
                    context: async ({ req, connectionParams, extra }) => {
                        return {
                            req,
                            connectionParams,
                            extra,
                        };
                    },
                    plugins: [sandboxPlugin, idPrefixPlugin] as any[],
                    subscriptions: {
                        'graphql-ws': {
                            path: '/graphql',
                        },
                    },
                    typeDefs,
                    resolvers,
                    /**
                     * @todo : Once we've determined how to fix the transformResolvers function, uncomment this.
                     */
                    // transformResolvers: (resolvers) => transformResolvers(resolvers, authZService),
                    // transformSchema: (schema) => authSchemaTransformer(schema),
                    validationRules: [NoUnusedVariablesRule],
                };
            },
        }),
    ],
    providers: [],
    exports: [GraphQLModule],
})
export class GraphModule {}
