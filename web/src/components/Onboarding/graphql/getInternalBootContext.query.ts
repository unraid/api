import gql from 'graphql-tag';

export const GET_INTERNAL_BOOT_CONTEXT_QUERY = gql`
  query GetInternalBootContext {
    array {
      state
      boot {
        device
        type
      }
      parities {
        device
      }
      disks {
        device
      }
      caches {
        name
        device
      }
    }
    vars {
      fsState
      bootEligible
      enableBootTransfer
      reservedNames
    }
    shares {
      name
    }
    disks {
      device
      size
      emhttpDeviceId
    }
  }
`;
