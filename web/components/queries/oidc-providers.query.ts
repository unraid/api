import gql from 'graphql-tag';

export const OIDC_PROVIDERS = gql`
  query OidcProviders {
    settings {
      sso {
        oidcProviders {
          id
          name
          clientId
          issuer
          authorizationEndpoint
          tokenEndpoint
          jwksUri
          scopes
          authorizationRules {
            claim
            operator
            value
          }
          authorizationRuleMode
          buttonText
          buttonIcon
        }
      }
    }
  }
`;
