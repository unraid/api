import { graphql } from '~/composables/gql/gql';

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
