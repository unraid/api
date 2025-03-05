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
    },
};

export default config;
