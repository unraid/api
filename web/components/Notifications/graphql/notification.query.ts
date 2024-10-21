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
