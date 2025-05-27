import type { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { NoUnusedVariablesRule } from 'graphql';
import { GraphQLBigInt, JSONResolver, URLResolver } from 'graphql-scalars';

import { ENVIRONMENT } from '@app/environment.js';
import { getters } from '@app/store/index.js';
import {
    UsePermissionsDirective,
    usePermissionsSchemaTransformer,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { ResolversModule } from '@app/unraid-api/graph/resolvers/resolvers.module.js';
import { sandboxPlugin } from '@app/unraid-api/graph/sandbox-plugin.js';
import { PrefixedID as PrefixedIDScalar } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';
import { PluginModule } from '@app/unraid-api/plugin/plugin.module.js';

@Module({
    imports: [
        ResolversModule,
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
            driver: ApolloDriver,
            imports: [PluginModule.register()],
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
                    plugins: [sandboxPlugin] as any[],
                    subscriptions: {
                        'graphql-ws': {
                            path: '/graphql',
                        },
                    },
                    buildSchemaOptions: {
                        dateScalarMode: 'isoDate',
                        directives: [UsePermissionsDirective],
                    },
                    transformSchema: usePermissionsSchemaTransformer,
                    validationRules: [NoUnusedVariablesRule],
                };
            },
        }),
    ],
    providers: [PrefixedIDScalar],
    exports: [GraphQLModule],
})
export class GraphModule {}
