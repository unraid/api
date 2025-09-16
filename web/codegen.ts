import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  documents: ['./**/**/*.ts'],
  ignoreNoDocuments: false,
  config: {
    namingConvention: {
      enumValues: 'change-case-all#upperCase',
      transformUnderscore: true,
    },
    scalars: {
      DateTime: 'string',
      Long: 'number',
      JSON: 'any',
      URL: 'URL',
      Port: 'number',
      UUID: 'string',
      PrefixedID: 'string',
      BigInt: 'number',
    },
  },
  generates: {
    'src/composables/gql/': {
      preset: 'client',
      config: {
        useTypeImports: true,
      },
      schema: '../api/generated-schema.graphql',
      plugins: [
        {
          add: {
            content: '/* eslint-disable */',
          },
        },
      ],
    },
  },
};

export default config;
