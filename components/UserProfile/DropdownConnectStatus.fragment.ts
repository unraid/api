import { graphql } from "~/composables/gql/gql";

export const TEST_FRAGMENT = graphql(/* GraphQL */`
  fragment TestFragment on Cloud {
    error
  }
`);

export const TEST_QUERY = graphql(/* GraphQL */`
  query cloudError {
    cloud {
      ...TestFragment
    }
  }
`);
