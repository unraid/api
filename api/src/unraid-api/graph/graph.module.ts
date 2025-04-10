import type { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { NoUnusedVariablesRule } from 'graphql';
import {
    DateTimeResolver,
    JSONResolver,
    PortResolver,
    URLResolver,
    UUIDResolver,
} from 'graphql-scalars';

import { GraphQLLong } from '@app/graphql/resolvers/graphql-type-long.js';
import { getters } from '@app/store/index.js';
import {
    AuthActionVerbEnum,
    AuthDirective,
    AuthPossessionEnum,
} from '@app/unraid-api/graph/auth/auth.enums.js';
import { idPrefixPlugin } from '@app/unraid-api/graph/id-prefix-plugin.js';
import { PluginSchemaService } from '@app/unraid-api/graph/plugin-schema.service.js';
import { ResolversModule } from '@app/unraid-api/graph/resolvers/resolvers.module.js';
import { sandboxPlugin } from '@app/unraid-api/graph/sandbox-plugin.js';

@Module({
    imports: [
        ResolversModule,
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
            driver: ApolloDriver,
            imports: [PluginSchemaService],
            inject: [PluginSchemaService],
            useFactory: async (pluginSchemaService: PluginSchemaService) => {
                return {
                    autoSchemaFile: true, // This will generate the schema in memory
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
                        DateTime: DateTimeResolver,
                        JSON: JSONResolver,
                        Long: GraphQLLong,
                        Port: PortResolver,
                        URL: URLResolver,
                        UUID: UUIDResolver,
                    },
                    buildSchemaOptions: {
                        directives: [AuthDirective],
                        numberScalarMode: 'integer',
                    },
                    validationRules: [NoUnusedVariablesRule],
                };
            },
        }),
    ],
    providers: [PluginSchemaService],
    exports: [GraphQLModule],
})
export class GraphModule {}
