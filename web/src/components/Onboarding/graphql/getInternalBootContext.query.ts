import gql from 'graphql-tag';

export const GET_INTERNAL_BOOT_CONTEXT_QUERY = gql`
  query GetInternalBootContext {
    array {
      state
      caches {
        name
      }
    }
    vars {
      fsState
      bootEligible
      bootedFromFlashWithInternalBootSetup
      enableBootTransfer
      reservedNames
    }
    shares {
      name
    }
    assignableDisks {
      device
      size
      serialNum
      interfaceType
    }
  }
`;
