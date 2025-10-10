import { graphql } from '~/composables/gql';

export const UPGRADE_INFO_QUERY = graphql(/* GraphQL */ `
  query UpgradeInfo {
    info {
      id
      versions {
        id
        upgrade {
          isUpgrade
          previousVersion
          currentVersion
        }
      }
    }
  }
`);
