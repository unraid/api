/* eslint-disable */
import * as types from './graphql.js';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel-plugin for production.
 */
const documents = {
    "\nmutation updateDashboard($data: DashboardInput!, $apiKey: String!) {\n\tupdateDashboard(data: $data) @auth(apiKey: $apiKey) {\n\t\tapps {\n\t\t\tinstalled\n\t\t}\n\t}\n}": types.updateDashboardDocument,
    "\nmutation sendNotification($notification:NotificationInput!, $apiKey: String!) {\n\tsendNotification(notification: $notification) @auth(apiKey: $apiKey)\n\t{\n\t\ttitle \n\t\tsubject \n\t\tdescription\n\t\timportance\n\t\tlink\n\t\tstatus\n\t}\n}": types.sendNotificationDocument,
    "\nquery queryServersFromMothership($apiKey: String!) {\n\tservers @auth(apiKey: $apiKey) {\n\t\towner {\n\t\t\tusername\n\t\t\turl\n\t\t\tavatar\n\t\t}\n\t\tguid\n\t\tapikey\n\t\tname\n\t\tstatus\n\t\twanip\n\t\tlanip\n\t\tlocalurl\n\t\tremoteurl\n\t}\n}\n\n": types.queryServersFromMothershipDocument,
    "\nsubscription events($apiKey: String!) {\n  events @auth(apiKey: $apiKey) {\n    ... on ClientConnectedEvent {\n      connectedData: data {\n        type\n        version\n        apiKey\n      }\n      connectedEvent: type\n    }\n    ... on ClientDisconnectedEvent {\n      disconnectedData: data {\n        type\n        version\n        apiKey\n      }\n      disconnectedEvent: type\n    }\n  }\n}\n": types.eventsDocument,
    "\nsubscription serversSubscription ($apiKey: String!) {\n    servers @auth(apiKey: $apiKey)\n}\n": types.serversSubscriptionDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nmutation updateDashboard($data: DashboardInput!, $apiKey: String!) {\n\tupdateDashboard(data: $data) @auth(apiKey: $apiKey) {\n\t\tapps {\n\t\t\tinstalled\n\t\t}\n\t}\n}"): (typeof documents)["\nmutation updateDashboard($data: DashboardInput!, $apiKey: String!) {\n\tupdateDashboard(data: $data) @auth(apiKey: $apiKey) {\n\t\tapps {\n\t\t\tinstalled\n\t\t}\n\t}\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nmutation sendNotification($notification:NotificationInput!, $apiKey: String!) {\n\tsendNotification(notification: $notification) @auth(apiKey: $apiKey)\n\t{\n\t\ttitle \n\t\tsubject \n\t\tdescription\n\t\timportance\n\t\tlink\n\t\tstatus\n\t}\n}"): (typeof documents)["\nmutation sendNotification($notification:NotificationInput!, $apiKey: String!) {\n\tsendNotification(notification: $notification) @auth(apiKey: $apiKey)\n\t{\n\t\ttitle \n\t\tsubject \n\t\tdescription\n\t\timportance\n\t\tlink\n\t\tstatus\n\t}\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nquery queryServersFromMothership($apiKey: String!) {\n\tservers @auth(apiKey: $apiKey) {\n\t\towner {\n\t\t\tusername\n\t\t\turl\n\t\t\tavatar\n\t\t}\n\t\tguid\n\t\tapikey\n\t\tname\n\t\tstatus\n\t\twanip\n\t\tlanip\n\t\tlocalurl\n\t\tremoteurl\n\t}\n}\n\n"): (typeof documents)["\nquery queryServersFromMothership($apiKey: String!) {\n\tservers @auth(apiKey: $apiKey) {\n\t\towner {\n\t\t\tusername\n\t\t\turl\n\t\t\tavatar\n\t\t}\n\t\tguid\n\t\tapikey\n\t\tname\n\t\tstatus\n\t\twanip\n\t\tlanip\n\t\tlocalurl\n\t\tremoteurl\n\t}\n}\n\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nsubscription events($apiKey: String!) {\n  events @auth(apiKey: $apiKey) {\n    ... on ClientConnectedEvent {\n      connectedData: data {\n        type\n        version\n        apiKey\n      }\n      connectedEvent: type\n    }\n    ... on ClientDisconnectedEvent {\n      disconnectedData: data {\n        type\n        version\n        apiKey\n      }\n      disconnectedEvent: type\n    }\n  }\n}\n"): (typeof documents)["\nsubscription events($apiKey: String!) {\n  events @auth(apiKey: $apiKey) {\n    ... on ClientConnectedEvent {\n      connectedData: data {\n        type\n        version\n        apiKey\n      }\n      connectedEvent: type\n    }\n    ... on ClientDisconnectedEvent {\n      disconnectedData: data {\n        type\n        version\n        apiKey\n      }\n      disconnectedEvent: type\n    }\n  }\n}\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nsubscription serversSubscription ($apiKey: String!) {\n    servers @auth(apiKey: $apiKey)\n}\n"): (typeof documents)["\nsubscription serversSubscription ($apiKey: String!) {\n    servers @auth(apiKey: $apiKey)\n}\n"];

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
**/
export function gql(source: string): unknown;

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;