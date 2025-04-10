import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  documents: ['./**/**/*.ts'],
  ignoreNoDocuments: false,
  config: {
    namingConvention: {
      typeNames: './fix-array-type.js',
    },
    scalars: {
      DateTime: 'string',
      Long: 'number',
      JSON: 'any',
      URL: 'URL',
      Port: 'number',
      UUID: 'string',
    },
  },
  generates: {
    'composables/gql/': {
      preset: 'client',
      config: {
        useTypeImports: true,
      },
      schema: '../api/generated-schema-new.graphql',
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
