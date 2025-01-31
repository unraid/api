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

import { GraphQLLong } from '@app/graphql/resolvers/graphql-type-long';
import { loadTypeDefs } from '@app/graphql/schema/loadTypesDefs';
import { getters } from '@app/store/index';
import { ConnectResolver } from '@app/unraid-api/graph/connect/connect.resolver';
import { ConnectService } from '@app/unraid-api/graph/connect/connect.service';
import { idPrefixPlugin } from '@app/unraid-api/graph/id-prefix-plugin';
import { NetworkResolver } from '@app/unraid-api/graph/network/network.resolver';
import { ResolversModule } from '@app/unraid-api/graph/resolvers/resolvers.module';
import { sandboxPlugin } from '@app/unraid-api/graph/sandbox-plugin';
import { ServicesResolver } from '@app/unraid-api/graph/services/services.resolver';
import { SharesResolver } from '@app/unraid-api/graph/shares/shares.resolver';

@Module({
    imports: [
        ResolversModule,
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
            driver: ApolloDriver,
            useFactory: async () => {
                const typeDefs = await loadTypeDefs();
                return {
                    introspection: getters.config()?.local?.sandbox === 'yes',
                    playground: false,
                    context: ({ req, connectionParams, extra }) => ({
                        req,
                        connectionParams,
                        extra,
                    }),
                    plugins: [sandboxPlugin, idPrefixPlugin],
                    subscriptions: {
                        'graphql-ws': {
                            path: '/graphql',
                        },
                    },
                    path: '/graphql',
                    typeDefs: print(typeDefs),
                    resolvers: {
                        JSON: JSONResolver,
                        Long: GraphQLLong,
                        UUID: UUIDResolver,
                        DateTime: DateTimeResolver,
                        Port: PortResolver,
                        URL: URLResolver,
                    },
                    validationRules: [NoUnusedVariablesRule],
                };
            },
        }),
    ],
    providers: [NetworkResolver, ServicesResolver, SharesResolver, ConnectResolver, ConnectService],
})
export class GraphModule {}
