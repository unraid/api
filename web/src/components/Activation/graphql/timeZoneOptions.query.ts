import { graphql } from '~/composables/gql';

export const TIME_ZONE_OPTIONS_QUERY = graphql(/* GraphQL */ `
  query TimeZoneOptions {
    timeZoneOptions {
      value
      label
    }
  }
`);
