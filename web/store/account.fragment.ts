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

export const SSO_ENABLED = graphql(/* GraphQL */`
  query IsSSOEnabled {
    isSSOEnabled
  }
`);
