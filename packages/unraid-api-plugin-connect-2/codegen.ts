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
            BigInt: 'number',
        },
        scalarSchemas: {
            URL: 'z.instanceof(URL)',
            Long: 'z.number()',
            JSON: 'z.record(z.string(), z.any())',
            Port: 'z.number()',
            UUID: 'z.string()',
            BigInt: 'z.number()',
        },
    },
    generates: {
        // No longer generating mothership GraphQL types since we switched to WebSocket-based UnraidServerClient
    },
};

export default config;
