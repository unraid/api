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
        name
        device
      }
    }
    vars {
      fsState
      bootEligible
    }
    shares {
      name
    }
    disks {
      id
      device
      serialNum
      size
      interfaceType
      emhttpDeviceId
      sectors
      sectorSize
    }
  }
`;
