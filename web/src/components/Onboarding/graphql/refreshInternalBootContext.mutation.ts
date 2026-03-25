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
        driveWarnings {
          diskId
          device
          warnings
        }
        assignableDisks {
          id
          device
          size
          serialNum
          interfaceType
        }
      }
    }
  }
`);
