import { graphql } from "~/composables/gql/gql";

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
  mutation ArchiveNotification($id: String!) {
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
  mutation DeleteNotification($id: String!, $type: NotificationType!) {
    deleteNotification(id: $id, type: $type) {
      archive {
        total
      }
    }
  }
`);

export const deleteAllNotifications = graphql(/* GraphQL */ `
  mutation DeleteAllNotifications {
    deleteAllNotifications {
      archive {
        total
      }
      unread {
        total
      }
    }
  }
`);

export const unreadOverview = graphql(/* GraphQL */ `
  query Overview {
    notifications {
      overview {
        unread {
          info
          warning
          alert
          total
        }
      }
    }
  }
`);
