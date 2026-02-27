import gql from 'graphql-tag';

export const GET_INTERNAL_BOOT_STEP_VISIBILITY_QUERY = gql`
  query GetInternalBootStepVisibility {
    vars {
      enableBootTransfer
    }
  }
`;
