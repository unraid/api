import { graphql } from '~/composables/gql';

export const UPDATE_SYSTEM_TIME_MUTATION = graphql(`
  mutation UpdateSystemTime($input: UpdateSystemTimeInput!) {
    updateSystemTime(input: $input) {
      currentTime
      timeZone
      useNtp
      ntpServers
    }
  }
`);
