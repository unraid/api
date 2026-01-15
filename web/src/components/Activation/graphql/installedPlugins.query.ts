import { graphql } from '@/composables/gql/gql';

export const INSTALLED_UNRAID_PLUGINS_QUERY = graphql(/* GraphQL */ `
  query InstalledUnraidPlugins {
    installedUnraidPlugins
  }
`);
