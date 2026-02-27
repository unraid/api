import gql from 'graphql-tag';

export const GET_INTERNAL_BOOT_CONTEXT_QUERY = gql`
  query GetInternalBootContext {
    onboardingInternalBoot {
      fsState
      bootEligible
      reservedNames
      shareNames
      poolNames
      defaultPoolName
      maxSlots
      bootSizePresetsMiB
      defaultBootSizeMiB
      deviceOptions {
        value
        label
        sizeMiB
      }
    }
  }
`;
