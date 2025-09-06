import { graphql } from '~/composables/gql';

export const INFO_VERSIONS_QUERY = graphql(/* GraphQL */ `
  query InfoVersions {
    info {
      id
      os {
        id
        hostname
      }
      versions {
        id
        core {
          unraid
          api
        }
      }
    }
  }
`);
