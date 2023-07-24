import { graphql } from '~/composables/gql/gql';

export const SERVER_CLOUD_QUERY = graphql(/* GraphQL */`
  query CloudStatus {
    cloud {
      ...FragmentCloud
    }
  }
`);
