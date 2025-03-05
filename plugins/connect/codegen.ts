import type { CodegenConfig } from '@graphql-codegen/cli';

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
        // Generate Types for the API Server
        'src/graphql/generated/api/types.ts': {
            schema: ['./src/graphql/types.ts', './src/graphql/schema/types/**/*.graphql'],
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
