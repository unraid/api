import { graphql } from '~/composables/gql/gql';

export const CONNECT_SIGN_IN = graphql(/* GraphQL */`
  mutation ConnectSignIn($input: ConnectSignInInput!) {
    connectSignIn(input: $input)
  }
`);

export const CONNECT_SIGN_OUT = graphql(/* GraphQL */`
  mutation SignOut {
    connectSignOut
  }
`);
