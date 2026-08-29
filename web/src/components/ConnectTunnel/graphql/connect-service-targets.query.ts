import { graphql } from '~/composables/gql/gql';

export const connectServiceTargetsQuery = graphql(/* GraphQL */ `
  query ConnectServiceTargets($skipCache: Boolean = false) {
    docker {
      id
      containers(skipCache: $skipCache) {
        id
        names
        state
        webUiUrl
        ports {
          ip
          privatePort
          publicPort
          type
        }
      }
    }
  }
`);
