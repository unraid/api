import { graphql } from "~/composables/gql/gql";

export const SET_ADDITIONAL_ALLOWED_ORIGINS = graphql(/* GraphQL */ `
  mutation setAdditionalAllowedOrigins($input: AllowedOriginInput!) {
    setAdditionalAllowedOrigins(input: $input)
  }
`);

export const SETUP_REMOTE_ACCESS = graphql(/* GraphQL */ `
    mutation setupRemoteAccess($input: SetupRemoteAccessInput!) {
        setupRemoteAccess(input: $input)
    }
`);