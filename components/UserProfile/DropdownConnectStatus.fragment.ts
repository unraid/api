import { graphql } from '~/composables/gql/gql';

export const ONLINE_QUERY = graphql(/* GraphQL */`
  query OnlineStatus {
    online
  }
`);
