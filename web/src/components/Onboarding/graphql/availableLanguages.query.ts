import gql from 'graphql-tag';

export const GET_AVAILABLE_LANGUAGES_QUERY = gql`
  query GetAvailableLanguages {
    customization {
      availableLanguages {
        code
        name
        url
      }
    }
  }
`;
