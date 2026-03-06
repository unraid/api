import { parse } from 'graphql';

export const ONBOARDING_QUERY = parse(/* GraphQL */ `
  query Onboarding {
    customization {
      onboarding {
        status
        isPartnerBuild
        completed
        completedAtVersion
      }
    }
  }
`);
