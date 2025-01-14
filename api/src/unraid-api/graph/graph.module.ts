import type { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
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
import { getters } from '@app/store';
import { idPrefixPlugin } from '@app/unraid-api/graph/id-prefix-plugin';

import { ConnectResolver } from './connect/connect.resolver';
import { ConnectService } from './connect/connect.service';
import { NetworkResolver } from './network/network.resolver';
import { ResolversModule } from './resolvers/resolvers.module';
import { ServicesResolver } from './services/services.resolver';
import { SharesResolver } from './shares/shares.resolver';

/** The initial query displayed in the Apollo sandbox */
const initialDocument = `query ExampleQuery {
  notifications {
    id
    overview {
      unread {
        info
        warning
        alert
        total
      }
      archive {
        info
        warning
        alert
        total
      }
    }
  }
}`;

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
                ? [
                      ApolloServerPluginLandingPageLocalDefault({
                          footer: false,
                          includeCookies: true,
                          document: initialDocument,
                          embed: {
                              initialState: {
                                  sharedHeaders: {
                                      'x-csrf-token': getters.emhttp().var.csrfToken ?? 'no csrf token',
                                  },
                              },
                          },
                      }),
                      idPrefixPlugin,
                  ]
                : [idPrefixPlugin],
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
