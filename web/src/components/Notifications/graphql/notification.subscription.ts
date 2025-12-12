import { graphql } from '~/composables/gql/gql';

export const notificationAddedSubscription = graphql(/* GraphQL */ `
  subscription NotificationAddedSub {
    notificationAdded {
      ...NotificationFragment
    }
  }
`);

export const notificationOverviewSubscription = graphql(/* GraphQL */ `
  subscription NotificationOverviewSub {
    notificationsOverview {
      archive {
        ...NotificationCountFragment
      }
      unread {
        ...NotificationCountFragment
      }
    }
  }
`);

export const warningsAndAlertsSubscription = graphql(/* GraphQL */ `
  subscription NotificationsWarningsAndAlertsSub {
    notificationsWarningsAndAlerts {
      ...NotificationFragment
    }
  }
`);
