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

@Module({
    imports: [
        ResolversModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            playground: true,
            installSubscriptionHandlers: true,
            path: '/graphql',
            typePaths: ['**/*.graphql'],
            resolvers: {
                JSON: JSONResolver,
                Long: GraphQLLong,
                UUID: UUIDResolver,
                DateTime: DateTimeResolver,
                Port: PortResolver,
                /* Mutation,
                Subscription,
                Vms: {
                    domain: domainResolver,
                }, */
            },
            // schema: schema
        }),
    ],
    providers: [],
})
export class GraphModule {}
