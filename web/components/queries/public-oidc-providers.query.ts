import { graphql } from '~/composables/gql/gql.js';

export const PUBLIC_OIDC_PROVIDERS = graphql(/* GraphQL */`
  query PublicOidcProviders {
    publicOidcProviders {
      id
      name
      buttonText
      buttonIcon
      buttonVariant
      buttonStyle
    }
  }
`);
