import type { CodegenConfig } from '@graphql-codegen/cli';



import { getAuthEnumTypeDefs } from './src/unraid-api/graph/directives/auth.directive.js';


const config: CodegenConfig = {
    overwrite: true,
    emitLegacyCommonJSImports: false,
    verbose: true,
    config: {
        namingConvention: {
            typeNames: './fix-array-type.cjs',
            enumValues: 'change-case#upperCase',
            useTypeImports: true,
        },
        scalars: {
            DateTime: 'string',
            Long: 'number',
            JSON: 'Record<string, any>',
            URL: 'URL',
            Port: 'number',
            UUID: 'string',
        },
        scalarSchemas: {
            URL: 'z.instanceof(URL)',
            Long: 'z.number()',
            JSON: 'z.record(z.string(), z.any())',
            Port: 'z.number()',
            UUID: 'z.string()',
        },
    },
    generates: {
        './generated-schema.graphql': {
            plugins: ['schema-ast'],
            schema: [
                './src/graphql/types.ts',
                './src/graphql/schema/types/**/*.graphql',
                getAuthEnumTypeDefs(),
            ],
        },
        // Generate Types for the API Server
        'src/graphql/generated/api/types.ts': {
            schema: [
                './src/graphql/types.ts',
                './src/graphql/schema/types/**/*.graphql',
                getAuthEnumTypeDefs(),
            ],
            plugins: [
                'typescript',
                'typescript-resolvers',
                { add: { content: '/* eslint-disable */\n/* @ts-nocheck */' } },
            ],
            config: {
                contextType: '@app/graphql/schema/utils.js#Context',
                useIndexSignature: true,
            },
        },
        // Generate Operations for any built-in API Server Operations (e.g., report.ts)
        'src/graphql/generated/api/operations.ts': {
            documents: './src/graphql/client/api/*.ts',
            schema: [
                './src/graphql/types.ts',
                './src/graphql/schema/types/**/*.graphql',
                getAuthEnumTypeDefs(),
            ],
            preset: 'import-types',
            presetConfig: {
                typesPath: '@app/graphql/generated/api/types.js',
            },
            plugins: [
                'typescript-validation-schema',
                'typescript-operations',
                'typed-document-node',
                { add: { content: '/* eslint-disable */' } },
            ],
            config: {
                importFrom: '@app/graphql/generated/api/types.js',
                strictScalars: true,
                schema: 'zod',
                withObjectType: true,
            },
        },
        // Generate Types for Mothership GraphQL Client
        'src/graphql/generated/client/': {
            documents: './src/graphql/mothership/*.ts',
            schema: {
                [process.env.MOTHERSHIP_GRAPHQL_LINK as string]: {
                    headers: {
                        origin: 'https://forums.unraid.net',
                    },
                },
            },
            preset: 'client',
            presetConfig: {
                gqlTagName: 'graphql',
            },
            config: {
                useTypeImports: true,
                withObjectType: true,
            },
            plugins: [{ add: { content: '/* eslint-disable */' } }],
        },
        'src/graphql/generated/client/validators.ts': {
            schema: {
                [process.env.MOTHERSHIP_GRAPHQL_LINK as string]: {
                    headers: {
                        origin: 'https://forums.unraid.net',
                    },
                },
            },
            plugins: ['typescript-validation-schema', { add: { content: '/* eslint-disable */' } }],
            config: {
                importFrom: '@app/graphql/generated/client/graphql.js',
                strictScalars: false,
                schema: 'zod',
            },
        },
    },
};

export default config;