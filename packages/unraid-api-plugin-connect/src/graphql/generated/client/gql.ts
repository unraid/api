/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

import * as types from './graphql.js';

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
type Documents = {
    '\n    fragment RemoteGraphQLEventFragment on RemoteGraphQLEvent {\n        remoteGraphQLEventData: data {\n            type\n            body\n            sha256\n        }\n    }\n': typeof types.RemoteGraphQlEventFragmentFragmentDoc;
    '\n    subscription events {\n        events {\n            __typename\n            ... on ClientConnectedEvent {\n                connectedData: data {\n                    type\n                    version\n                    apiKey\n                }\n                connectedEvent: type\n            }\n            ... on ClientDisconnectedEvent {\n                disconnectedData: data {\n                    type\n                    version\n                    apiKey\n                }\n                disconnectedEvent: type\n            }\n            ...RemoteGraphQLEventFragment\n        }\n    }\n': typeof types.EventsDocument;
    '\n    mutation sendRemoteGraphQLResponse($input: RemoteGraphQLServerInput!) {\n        remoteGraphQLResponse(input: $input)\n    }\n': typeof types.SendRemoteGraphQlResponseDocument;
};
const documents: Documents = {
    '\n    fragment RemoteGraphQLEventFragment on RemoteGraphQLEvent {\n        remoteGraphQLEventData: data {\n            type\n            body\n            sha256\n        }\n    }\n':
        types.RemoteGraphQlEventFragmentFragmentDoc,
    '\n    subscription events {\n        events {\n            __typename\n            ... on ClientConnectedEvent {\n                connectedData: data {\n                    type\n                    version\n                    apiKey\n                }\n                connectedEvent: type\n            }\n            ... on ClientDisconnectedEvent {\n                disconnectedData: data {\n                    type\n                    version\n                    apiKey\n                }\n                disconnectedEvent: type\n            }\n            ...RemoteGraphQLEventFragment\n        }\n    }\n':
        types.EventsDocument,
    '\n    mutation sendRemoteGraphQLResponse($input: RemoteGraphQLServerInput!) {\n        remoteGraphQLResponse(input: $input)\n    }\n':
        types.SendRemoteGraphQlResponseDocument,
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
export function graphql(
    source: '\n    fragment RemoteGraphQLEventFragment on RemoteGraphQLEvent {\n        remoteGraphQLEventData: data {\n            type\n            body\n            sha256\n        }\n    }\n'
): (typeof documents)['\n    fragment RemoteGraphQLEventFragment on RemoteGraphQLEvent {\n        remoteGraphQLEventData: data {\n            type\n            body\n            sha256\n        }\n    }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
    source: '\n    subscription events {\n        events {\n            __typename\n            ... on ClientConnectedEvent {\n                connectedData: data {\n                    type\n                    version\n                    apiKey\n                }\n                connectedEvent: type\n            }\n            ... on ClientDisconnectedEvent {\n                disconnectedData: data {\n                    type\n                    version\n                    apiKey\n                }\n                disconnectedEvent: type\n            }\n            ...RemoteGraphQLEventFragment\n        }\n    }\n'
): (typeof documents)['\n    subscription events {\n        events {\n            __typename\n            ... on ClientConnectedEvent {\n                connectedData: data {\n                    type\n                    version\n                    apiKey\n                }\n                connectedEvent: type\n            }\n            ... on ClientDisconnectedEvent {\n                disconnectedData: data {\n                    type\n                    version\n                    apiKey\n                }\n                disconnectedEvent: type\n            }\n            ...RemoteGraphQLEventFragment\n        }\n    }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
    source: '\n    mutation sendRemoteGraphQLResponse($input: RemoteGraphQLServerInput!) {\n        remoteGraphQLResponse(input: $input)\n    }\n'
): (typeof documents)['\n    mutation sendRemoteGraphQLResponse($input: RemoteGraphQLServerInput!) {\n        remoteGraphQLResponse(input: $input)\n    }\n'];

export function graphql(source: string) {
    return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
    TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
