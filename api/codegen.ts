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
        // Generate Types for CLI Internal GraphQL Queries
        'src/unraid-api/cli/generated/': {
            documents: ['src/unraid-api/cli/queries/**/*.ts', 'src/unraid-api/cli/mutations/**/*.ts'],
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
