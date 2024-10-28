# Contribution Guide for unraid/api/web

## Web Components

For legacy compatibility, Unraid ships web components to the webgui. These components
are written as Vue and turned into web components as a build step. By convention,
Vue components that are built as top-level web components are suffixed with `*.ce.vue`
for "**c**ustom **e**lement", which comes from the tool used for compilation: `nuxt-custom-elements`.

Note: `nuxt-custom-elements` is currently pinned to a specific version because
our build process breaks in later versions.

## Graphql

Unraid uses graphql to fetch & update server-related data. The web code uses `graphql-codegen` to
sync graphql schemas & generate typescript types & utilities.

During development, we often have `npm run codegen:watch` running in the background.

When using graphql, import helper functions from `~/composables`, e.g.:

```ts
import { graphql } from "~/composables/gql/gql";
```

Use it to define type fragments, queries, and mutations, e.g.:

```ts
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
```

Note the `/* GraphQL */` pragma. This enables syntax highlighting & type-sense for
graphql stuff.

You should define graphql-related snippets outside of your Vue components, so they're
easier to re-use and independently validate.