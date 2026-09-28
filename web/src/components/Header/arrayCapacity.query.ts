import { graphql } from '~/composables/gql';

export const ARRAY_CAPACITY_QUERY = graphql(/* GraphQL */ `
  query ArrayCapacity {
    array {
      id
      state
      capacity {
        kilobytes {
          free
          used
          total
        }
      }
    }
  }
`);
