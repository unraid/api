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
    },
  },
  generates: {
    // Generate Types for API GraphQL Client (localhost:3001)
    'composables/gql/api/': {
      preset: 'client',
      config: {
        useTypeImports: true,
      },
      schema: 'http://localhost:3001/graphql',
      plugins: [
        {
          add: {
            content: '/* eslint-disable */',
          },
        },
      ],
    },
    // Generate Types for Mothership GraphQL Client (localhost:8787)
    'composables/gql/mothership/': {
      preset: 'client',
      config: {
        useTypeImports: true,
      },
      schema: {
        'http://localhost:8787/graphql': {
          headers: {
            origin: 'https://forums.unraid.net',
          },
        },
      },
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