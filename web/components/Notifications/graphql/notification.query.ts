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

export const archiveAllNotifications = graphql(/* GraphQL */ `
  mutation ArchiveAllNotifications {
    archiveAll {
      unread {
        total
      }
      archive {
        info
        warning
        alert
        total
      }
    }
  }
`);

export const deleteNotification = graphql(/* GraphQL */ `
  mutation DeleteNotification($id: PrefixedID!, $type: NotificationType!) {
    deleteNotification(id: $id, type: $type) {
      archive {
        total
      }
    }
  }
`);

export const deleteArchivedNotifications = graphql(/* GraphQL */ `
  mutation DeleteAllNotifications {
    deleteArchivedNotifications {
      archive {
        total
      }
      unread {
        total
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
