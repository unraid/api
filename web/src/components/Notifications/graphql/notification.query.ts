import { graphql } from '~/composables/gql/gql';

export const NOTIFICATION_FRAGMENT = graphql(/* GraphQL */ `
  fragment NotificationFragment on Notification {
    id
    title
    subject
    description
    importance
    link
    type
    timestamp
    formattedTimestamp
  }
`);

export const NOTIFICATION_COUNT_FRAGMENT = graphql(/* GraphQL */ `
  fragment NotificationCountFragment on NotificationCounts {
    total
    info
    warning
    alert
  }
`);

export const NOTIFICATION_JOB_FRAGMENT = graphql(/* GraphQL */ `
  fragment NotificationJobFragment on NotificationJob {
    id
    operation
    state
    processed
    total
    error
  }
`);

export const getNotifications = graphql(/* GraphQL */ `
  query Notifications($filter: NotificationFilter!) {
    notifications {
      id
      list(filter: $filter) {
        ...NotificationFragment
      }
    }
  }
`);

export const archiveNotification = graphql(/* GraphQL */ `
  mutation ArchiveNotification($id: PrefixedID!) {
    archiveNotification(id: $id) {
      ...NotificationFragment
    }
  }
`);

export const deleteNotification = graphql(/* GraphQL */ `
  mutation DeleteNotification($id: PrefixedID!, $type: NotificationType!) {
    notifications {
      delete(id: $id, type: $type) {
        archive {
          total
        }
        unread {
          total
        }
      }
    }
  }
`);

export const archiveAllNotifications = graphql(/* GraphQL */ `
  mutation StartArchiveAllNotifications($importance: NotificationImportance) {
    notifications {
      startArchiveAll(importance: $importance) {
        ...NotificationJobFragment
      }
    }
  }
`);

export const startDeleteNotifications = graphql(/* GraphQL */ `
  mutation StartDeleteNotifications($type: NotificationType) {
    notifications {
      startDeleteAll(type: $type) {
        ...NotificationJobFragment
      }
    }
  }
`);

export const notificationsOverview = graphql(/* GraphQL */ `
  query Overview {
    notifications {
      id
      overview {
        unread {
          info
          warning
          alert
          total
        }
        archive {
          total
        }
      }
    }
  }
`);

export const notificationJobStatus = graphql(/* GraphQL */ `
  query NotificationJobStatus($id: ID!) {
    notifications {
      job(id: $id) {
        ...NotificationJobFragment
      }
    }
  }
`);

/** Re-calculates the notifications overview (i.e. notification counts) */
export const resetOverview = graphql(/* GraphQL */ `
  mutation RecomputeOverview {
    recalculateOverview {
      archive {
        ...NotificationCountFragment
      }
      unread {
        ...NotificationCountFragment
      }
    }
  }
`);
