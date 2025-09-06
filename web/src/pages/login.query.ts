import { gql } from '@apollo/client/core';

export const SERVER_INFO_QUERY = gql`
  query serverInfo {
    info {
      os {
        hostname
      }
    }
    vars {
      comment
    }
  }
`;
