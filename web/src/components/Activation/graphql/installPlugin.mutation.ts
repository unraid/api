import { graphql } from '~/composables/gql';

export const INSTALL_PLUGIN_MUTATION = graphql(/* GraphQL */ `
  mutation InstallPlugin($input: InstallPluginInput!) {
    unraidPlugins {
      installPlugin(input: $input) {
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
  }
`);
