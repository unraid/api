import { graphql } from '~/composables/gql/index.js';

export const PLUGIN_INSTALL_OPERATION_QUERY = graphql(/* GraphQL */ `
  query PluginInstallOperation($operationId: ID!) {
    pluginInstallOperation(operationId: $operationId) {
      id
      url
      name
      status
      createdAt
      updatedAt
      finishedAt
      output
    }
  }
`);
