import gql from 'graphql-tag';

export const GET_AVAILABLE_LANGUAGES_QUERY = gql`
  query GetAvailableLanguages {
    availableLanguages {
      code
      name
      url
    }
  }
`;
