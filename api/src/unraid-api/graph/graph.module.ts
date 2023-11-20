import {
    DateTimeResolver,
    JSONResolver,
    PortResolver,
    UUIDResolver,
} from 'graphql-scalars';
import { GraphQLLong } from '@app/graphql/resolvers/graphql-type-long';

import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ResolversModule } from './resolvers/resolvers.module';
import { GRAPHQL_INTROSPECTION } from '@app/environment';

@Module({
    imports: [
        ResolversModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            playground: true,
            introspection: GRAPHQL_INTROSPECTION ? true : false,
            context: ({ req, connectionParams, extra }) => ({
                req,
                connectionParams,
                extra,
            }),

            subscriptions: {
                'graphql-ws': {
                    path: '/graphql',
                },
                'subscriptions-transport-ws': {
                    path: '/graphql',
                },
            },
            path: '/graphql',
            typePaths: ['**/*.graphql'],
            resolvers: {
                JSON: JSONResolver,
                Long: GraphQLLong,
                UUID: UUIDResolver,
                DateTime: DateTimeResolver,
                Port: PortResolver,
            },
            // schema: schema
        }),
    ],
    providers: [],
})
export class GraphModule {}
