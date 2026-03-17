import gql from 'graphql-tag';

export const GET_INTERNAL_BOOT_CONTEXT_QUERY = gql`
  query GetInternalBootContext {
    internalBootContext {
      arrayStopped
      bootEligible
      bootedFromFlashWithInternalBootSetup
      enableBootTransfer
      reservedNames
      shareNames
      poolNames
      assignableDisks {
        id
        device
        size
        serialNum
        interfaceType
      }
    }
  }
`;
