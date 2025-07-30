import type { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';

import {
    UsePermissionsDirective,
    usePermissionsSchemaTransformer,
} from '@unraid/shared/use-permissions.directive.js';
import { NoUnusedVariablesRule } from 'graphql';

import { ENVIRONMENT } from '@app/environment.js';
import { ApiConfigModule } from '@app/unraid-api/config/api-config.module.js';
import { ResolversModule } from '@app/unraid-api/graph/resolvers/resolvers.module.js';
import { createSandboxPlugin } from '@app/unraid-api/graph/sandbox-plugin.js';
import { GlobalDepsModule } from '@app/unraid-api/plugin/global-deps.module.js';
import { PluginModule } from '@app/unraid-api/plugin/plugin.module.js';

@Module({
    imports: [
        GlobalDepsModule,
        ResolversModule,
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
            driver: ApolloDriver,
            imports: [PluginModule.register(), ApiConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const isSandboxEnabled = () => Boolean(configService.get('api.sandbox'));
                return {
                    autoSchemaFile:
                        ENVIRONMENT === 'development'
                            ? {
                                  path: './generated-schema.graphql',
                              }
                            : true,
                    introspection: isSandboxEnabled(),
                    playground: false, // we handle this in the sandbox plugin
                    context: async ({ req, connectionParams, extra }) => {
                        return {
                            req,
                            connectionParams,
                            extra,
                        };
                    },
                    plugins: [createSandboxPlugin(isSandboxEnabled)] as any[],
                    subscriptions: {
                        'graphql-ws': {
                            path: '/graphql',
                        },
                    },
                    buildSchemaOptions: {
                        dateScalarMode: 'isoDate',
                        // Only add directive when not in test environment to avoid GraphQL version conflicts
                        directives: process.env.NODE_ENV === 'test' ? [] : [UsePermissionsDirective],
                    },
                    // Only add transform when not in test environment to avoid GraphQL version conflicts
                    transformSchema:
                        process.env.NODE_ENV === 'test' ? undefined : usePermissionsSchemaTransformer,
                    validationRules: [NoUnusedVariablesRule],
                };
            },
        }),
    ],
    providers: [],
    exports: [GraphQLModule],
})
export class GraphModule {}
