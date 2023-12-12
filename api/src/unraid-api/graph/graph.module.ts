import {
    DateTimeResolver,
    JSONResolver,
    PortResolver,
    UUIDResolver,
} from 'graphql-scalars';
import { GraphQLLong } from '@app/graphql/resolvers/graphql-type-long';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ResolversModule } from './resolvers/resolvers.module';
import { GRAPHQL_INTROSPECTION } from '@app/environment';
import { typeDefs } from '@app/graphql/schema/index';
import { print } from 'graphql';

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
            plugins: GRAPHQL_INTROSPECTION
                ? [ApolloServerPluginLandingPageLocalDefault()]
                : [],
            subscriptions: {
                'graphql-ws': {
                    path: '/graphql',
                }
            },
            path: '/graphql',
            typeDefs: print(typeDefs),
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
