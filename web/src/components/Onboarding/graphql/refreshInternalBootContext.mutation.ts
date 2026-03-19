import { graphql } from '~/composables/gql';

export const REFRESH_INTERNAL_BOOT_CONTEXT_MUTATION = graphql(/* GraphQL */ `
  mutation RefreshInternalBootContext {
    onboarding {
      refreshInternalBootContext {
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
          partitions {
            name
          }
        }
      }
    }
  }
`);
