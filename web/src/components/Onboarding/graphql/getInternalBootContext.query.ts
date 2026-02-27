import gql from 'graphql-tag';

export const GET_INTERNAL_BOOT_CONTEXT_QUERY = gql`
  query GetInternalBootContext {
    array {
      state
      boot {
        device
      }
      parities {
        device
      }
      disks {
        device
      }
      caches {
        device
      }
    }
    vars {
      fsState
    }
    disks {
      id
      device
      serialNum
      size
      interfaceType
    }
  }
`;
