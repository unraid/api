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
import { ConnectSettingsService } from '@app/unraid-api/graph/connect/connect-settings.service.js';
import { ConnectResolver } from '@app/unraid-api/graph/connect/connect.resolver.js';
import { ConnectService } from '@app/unraid-api/graph/connect/connect.service.js';
import { idPrefixPlugin } from '@app/unraid-api/graph/id-prefix-plugin.js';
import { NetworkResolver } from '@app/unraid-api/graph/network/network.resolver.js';
import { ResolversModule } from '@app/unraid-api/graph/resolvers/resolvers.module.js';
import { sandboxPlugin } from '@app/unraid-api/graph/sandbox-plugin.js';
import { ServicesResolver } from '@app/unraid-api/graph/services/services.resolver.js';
import { SharesResolver } from '@app/unraid-api/graph/shares/shares.resolver.js';
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
                    path: '/graphql',
                    typeDefs: [print(await loadTypeDefs([plugins.typeDefs]))],
                    resolvers: {
                        JSON: JSONResolver,
                        Long: GraphQLLong,
                        UUID: UUIDResolver,
                        DateTime: DateTimeResolver,
                        Port: PortResolver,
                        URL: URLResolver,
                        ...plugins.resolvers,
                    },
                    validationRules: [NoUnusedVariablesRule],
                };
            },
        }),
    ],
    providers: [
        NetworkResolver,
        ServicesResolver,
        SharesResolver,
        ConnectResolver,
        ConnectService,
        ConnectSettingsService,
    ],
})
export class GraphModule {}
