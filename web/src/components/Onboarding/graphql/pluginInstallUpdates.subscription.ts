import { graphql } from '~/composables/gql/index.js';

export const PLUGIN_INSTALL_UPDATES_SUBSCRIPTION = graphql(/* GraphQL */ `
  subscription PluginInstallUpdates($operationId: ID!) {
    pluginInstallUpdates(operationId: $operationId) {
      operationId
      status
      output
      timestamp
    }
  }
`);
