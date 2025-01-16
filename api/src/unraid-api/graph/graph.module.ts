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

import { GRAPHQL_INTROSPECTION } from '@app/environment';
import { GraphQLLong } from '@app/graphql/resolvers/graphql-type-long';
import { typeDefs } from '@app/graphql/schema/index';
import { idPrefixPlugin } from '@app/unraid-api/graph/id-prefix-plugin';

import { ConnectResolver } from './connect/connect.resolver';
import { ConnectService } from './connect/connect.service';
import { NetworkResolver } from './network/network.resolver';
import { ResolversModule } from './resolvers/resolvers.module';
import { sandboxPlugin } from './sandbox-plugin';
import { ServicesResolver } from './services/services.resolver';
import { SharesResolver } from './shares/shares.resolver';

@Module({
    imports: [
        ResolversModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            introspection: GRAPHQL_INTROSPECTION ? true : false,
            context: ({ req, connectionParams, extra }) => ({
                req,
                connectionParams,
                extra,
            }),
            playground: false,
            plugins: GRAPHQL_INTROSPECTION ? [sandboxPlugin, idPrefixPlugin] : [idPrefixPlugin],
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
            // schema: schema
        }),
    ],
    providers: [NetworkResolver, ServicesResolver, SharesResolver, ConnectResolver, ConnectService],
})
export class GraphModule {}
