import gql from 'graphql-tag';

export const GET_ARRAY_STATE_QUERY = gql`
  query GetArrayState {
    array {
      state
    }
  }
`;
