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
        // Generate Types for Mothership GraphQL Client (localhost:8787)
        'src/graphql/generated/mothership/': {
            documents: './src/graphql/mothership/*.ts',
            schema: {
                'http://localhost:8787/graphql': {
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
        'src/graphql/generated/mothership/validators.ts': {
            schema: {
                'http://localhost:8787/graphql': {
                    headers: {
                        origin: 'https://forums.unraid.net',
                    },
                },
            },
            plugins: ['typescript-validation-schema', { add: { content: '/* eslint-disable */' } }],
            config: {
                importFrom: '@app/graphql/generated/mothership/graphql.js',
                strictScalars: false,
                schema: 'zod',
            },
        },
        // Generate Types for API GraphQL Client (localhost:3001)
        'src/graphql/generated/api/': {
            documents: './src/graphql/api/*.ts',
            schema: {
                'http://localhost:3001/graphql': {
                    headers: {
                        'Content-Type': 'application/json',
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
        'src/graphql/generated/api/validators.ts': {
            schema: {
                'http://localhost:3001/graphql': {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            },
            plugins: ['typescript-validation-schema', { add: { content: '/* eslint-disable */' } }],
            config: {
                importFrom: '@app/graphql/generated/api/graphql.js',
                strictScalars: false,
                schema: 'zod',
            },
        },
    },
};

export default config;
