import { graphql } from '~/composables/gql';

export const CREATE_INTERNAL_BOOT_POOL_MUTATION = graphql(/* GraphQL */ `
  mutation CreateInternalBootPool($input: CreateInternalBootPoolInput!) {
    onboarding {
      createInternalBootPool(input: $input) {
        ok
        code
        output
      }
    }
  }
`);
