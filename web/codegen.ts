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
      JSON: 'string',
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
      schema: [
        {
          'http://localhost:3001/graphql': {
            headers: {
              origin: '/var/run/unraid-php.sock',
              'x-api-key': 'unupc_fab6ff6ffe51040595c6d9ffb63a353ba16cc2ad7d93f813a2e80a5810',
            },
          },
        },
      ],
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
