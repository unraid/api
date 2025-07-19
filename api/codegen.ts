import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    overwrite: true,
    emitLegacyCommonJSImports: false,
    verbose: true,
    config: {
        namingConvention: {
            enumValues: 'change-case-all#upperCase',
            transformUnderscore: true,
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
        // Generate Types for CLI Internal GraphQL Queries
        'src/unraid-api/cli/generated/': {
            documents: ['src/unraid-api/cli/queries/**/*.ts'],
            schema: './generated-schema.graphql',
            preset: 'client',
            presetConfig: {
                gqlTagName: 'gql',
            },
            config: {
                useTypeImports: true,
                withObjectType: true,
            },
            plugins: [{ add: { content: '/* eslint-disable */' } }],
        },
    },
};

export default config;
