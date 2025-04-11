import type { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { NoUnusedVariablesRule } from 'graphql';
import { JSONResolver, URLResolver } from 'graphql-scalars';

import { ENVIRONMENT } from '@app/environment.js';
import { GraphQLLong } from '@app/graphql/resolvers/graphql-type-long.js';
import { getters } from '@app/store/index.js';
import { idPrefixPlugin } from '@app/unraid-api/graph/id-prefix-plugin.js';
import { ResolversModule } from '@app/unraid-api/graph/resolvers/resolvers.module.js';
import { sandboxPlugin } from '@app/unraid-api/graph/sandbox-plugin.js';

@Module({
    imports: [
        ResolversModule,
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
            driver: ApolloDriver,
            imports: [],
            inject: [],
            useFactory: async () => {
                return {
                    autoSchemaFile:
                        ENVIRONMENT === 'development'
                            ? {
                                  path: './generated-schema.graphql',
                              }
                            : true,
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
                    resolvers: {
                        JSON: JSONResolver,
                        Long: GraphQLLong,
                        URL: URLResolver,
                    },
                    buildSchemaOptions: {
                        dateScalarMode: 'isoDate',
                    },
                    validationRules: [NoUnusedVariablesRule],
                };
            },
        }),
    ],
    providers: [],
    exports: [GraphQLModule],
})
export class GraphModule {}
