/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
const documents = {
    "\n  fragment NotificationFragment on Notification {\n    id\n    title\n    subject\n    description\n    importance\n    link\n    type\n    timestamp\n    formattedTimestamp\n  }\n": types.NotificationFragmentFragmentDoc,
    "\n  fragment NotificationCountFragment on NotificationCounts {\n    total\n    info\n    warning\n    alert\n  }\n": types.NotificationCountFragmentFragmentDoc,
    "\n  query Notifications($filter: NotificationFilter!) {\n    notifications {\n      id\n      list(filter: $filter) {\n        ...NotificationFragment\n      }\n    }\n  }\n": types.NotificationsDocument,
    "\n  mutation ArchiveNotification($id: String!) {\n    archiveNotification(id: $id) {\n      ...NotificationFragment\n    }\n  }\n": types.ArchiveNotificationDocument,
    "\n  mutation ArchiveAllNotifications {\n    archiveAll {\n      unread {\n        total\n      }\n      archive {\n        info\n        warning\n        alert\n        total\n      }\n    }\n  }\n": types.ArchiveAllNotificationsDocument,
    "\n  mutation DeleteNotification($id: String!, $type: NotificationType!) {\n    deleteNotification(id: $id, type: $type) {\n      archive {\n        total\n      }\n    }\n  }\n": types.DeleteNotificationDocument,
    "\n  mutation DeleteAllNotifications {\n    deleteAllNotifications {\n      archive {\n        total\n      }\n      unread {\n        total\n      }\n    }\n  }\n": types.DeleteAllNotificationsDocument,
    "\n  query Overview {\n    notifications {\n      overview {\n        unread {\n          info\n          warning\n          alert\n          total\n        }\n      }\n    }\n  }\n": types.OverviewDocument,
    "\n  mutation ConnectSignIn($input: ConnectSignInInput!) {\n    connectSignIn(input: $input)\n  }\n": types.ConnectSignInDocument,
    "\n  mutation SignOut {\n    connectSignOut\n  }\n": types.SignOutDocument,
    "\n  fragment PartialCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n": types.PartialCloudFragmentDoc,
    "\n  query serverState {\n    cloud {\n      ...PartialCloud\n    }\n    config {\n      error\n      valid\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      avatar\n      username\n    }\n    registration {\n      state\n      expiration\n      keyFile {\n        contents\n      }\n      updateExpiration\n    }\n    vars {\n      regGen\n      regState\n      configError\n      configValid\n    }\n  }\n": types.serverStateDocument,
    "\n  query getExtraAllowedOrigins {\n    extraAllowedOrigins\n  }\n": types.getExtraAllowedOriginsDocument,
    "\n  query getRemoteAccess {\n    remoteAccess {\n      accessType\n      forwardType\n      port\n    }\n  }\n": types.getRemoteAccessDocument,
    "\n  mutation setAdditionalAllowedOrigins($input: AllowedOriginInput!) {\n    setAdditionalAllowedOrigins(input: $input)\n  }\n": types.setAdditionalAllowedOriginsDocument,
    "\n    mutation setupRemoteAccess($input: SetupRemoteAccessInput!) {\n        setupRemoteAccess(input: $input)\n    }\n": types.setupRemoteAccessDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment NotificationFragment on Notification {\n    id\n    title\n    subject\n    description\n    importance\n    link\n    type\n    timestamp\n    formattedTimestamp\n  }\n"): (typeof documents)["\n  fragment NotificationFragment on Notification {\n    id\n    title\n    subject\n    description\n    importance\n    link\n    type\n    timestamp\n    formattedTimestamp\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment NotificationCountFragment on NotificationCounts {\n    total\n    info\n    warning\n    alert\n  }\n"): (typeof documents)["\n  fragment NotificationCountFragment on NotificationCounts {\n    total\n    info\n    warning\n    alert\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Notifications($filter: NotificationFilter!) {\n    notifications {\n      id\n      list(filter: $filter) {\n        ...NotificationFragment\n      }\n    }\n  }\n"): (typeof documents)["\n  query Notifications($filter: NotificationFilter!) {\n    notifications {\n      id\n      list(filter: $filter) {\n        ...NotificationFragment\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveNotification($id: String!) {\n    archiveNotification(id: $id) {\n      ...NotificationFragment\n    }\n  }\n"): (typeof documents)["\n  mutation ArchiveNotification($id: String!) {\n    archiveNotification(id: $id) {\n      ...NotificationFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveAllNotifications {\n    archiveAll {\n      unread {\n        total\n      }\n      archive {\n        info\n        warning\n        alert\n        total\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ArchiveAllNotifications {\n    archiveAll {\n      unread {\n        total\n      }\n      archive {\n        info\n        warning\n        alert\n        total\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteNotification($id: String!, $type: NotificationType!) {\n    deleteNotification(id: $id, type: $type) {\n      archive {\n        total\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteNotification($id: String!, $type: NotificationType!) {\n    deleteNotification(id: $id, type: $type) {\n      archive {\n        total\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAllNotifications {\n    deleteAllNotifications {\n      archive {\n        total\n      }\n      unread {\n        total\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteAllNotifications {\n    deleteAllNotifications {\n      archive {\n        total\n      }\n      unread {\n        total\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Overview {\n    notifications {\n      overview {\n        unread {\n          info\n          warning\n          alert\n          total\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query Overview {\n    notifications {\n      overview {\n        unread {\n          info\n          warning\n          alert\n          total\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ConnectSignIn($input: ConnectSignInInput!) {\n    connectSignIn(input: $input)\n  }\n"): (typeof documents)["\n  mutation ConnectSignIn($input: ConnectSignInInput!) {\n    connectSignIn(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SignOut {\n    connectSignOut\n  }\n"): (typeof documents)["\n  mutation SignOut {\n    connectSignOut\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PartialCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n"): (typeof documents)["\n  fragment PartialCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query serverState {\n    cloud {\n      ...PartialCloud\n    }\n    config {\n      error\n      valid\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      avatar\n      username\n    }\n    registration {\n      state\n      expiration\n      keyFile {\n        contents\n      }\n      updateExpiration\n    }\n    vars {\n      regGen\n      regState\n      configError\n      configValid\n    }\n  }\n"): (typeof documents)["\n  query serverState {\n    cloud {\n      ...PartialCloud\n    }\n    config {\n      error\n      valid\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      avatar\n      username\n    }\n    registration {\n      state\n      expiration\n      keyFile {\n        contents\n      }\n      updateExpiration\n    }\n    vars {\n      regGen\n      regState\n      configError\n      configValid\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getExtraAllowedOrigins {\n    extraAllowedOrigins\n  }\n"): (typeof documents)["\n  query getExtraAllowedOrigins {\n    extraAllowedOrigins\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getRemoteAccess {\n    remoteAccess {\n      accessType\n      forwardType\n      port\n    }\n  }\n"): (typeof documents)["\n  query getRemoteAccess {\n    remoteAccess {\n      accessType\n      forwardType\n      port\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation setAdditionalAllowedOrigins($input: AllowedOriginInput!) {\n    setAdditionalAllowedOrigins(input: $input)\n  }\n"): (typeof documents)["\n  mutation setAdditionalAllowedOrigins($input: AllowedOriginInput!) {\n    setAdditionalAllowedOrigins(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation setupRemoteAccess($input: SetupRemoteAccessInput!) {\n        setupRemoteAccess(input: $input)\n    }\n"): (typeof documents)["\n    mutation setupRemoteAccess($input: SetupRemoteAccessInput!) {\n        setupRemoteAccess(input: $input)\n    }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;