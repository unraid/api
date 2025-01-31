import { graphql } from '~/composables/gql/gql';

export const notificationAddedSubscription = graphql(/* GraphQL */ `
  subscription NotificationAddedSub {
    notificationAdded {
      ...NotificationFragment
    }
  }
`);
