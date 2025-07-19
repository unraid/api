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
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n    mutation UpdateSandboxSettings($input: JSON!) {\n        updateSettings(input: $input) {\n            restartRequired\n            values\n        }\n    }\n": typeof types.UpdateSandboxSettingsDocument,
    "\n    query SystemReport {\n        info {\n            id\n            machineId\n            system {\n                manufacturer\n                model\n                version\n                sku\n                serial\n                uuid\n            }\n            versions {\n                unraid\n                kernel\n                openssl\n            }\n        }\n        config {\n            id\n            valid\n            error\n        }\n        server {\n            id\n            name\n        }\n    }\n": typeof types.SystemReportDocument,
    "\n    query ConnectStatus {\n        connect {\n            id\n            dynamicRemoteAccess {\n                enabledType\n                runningType\n                error\n            }\n        }\n    }\n": typeof types.ConnectStatusDocument,
    "\n    query Services {\n        services {\n            id\n            name\n            online\n            uptime {\n                timestamp\n            }\n            version\n        }\n    }\n": typeof types.ServicesDocument,
};
const documents: Documents = {
    "\n    mutation UpdateSandboxSettings($input: JSON!) {\n        updateSettings(input: $input) {\n            restartRequired\n            values\n        }\n    }\n": types.UpdateSandboxSettingsDocument,
    "\n    query SystemReport {\n        info {\n            id\n            machineId\n            system {\n                manufacturer\n                model\n                version\n                sku\n                serial\n                uuid\n            }\n            versions {\n                unraid\n                kernel\n                openssl\n            }\n        }\n        config {\n            id\n            valid\n            error\n        }\n        server {\n            id\n            name\n        }\n    }\n": types.SystemReportDocument,
    "\n    query ConnectStatus {\n        connect {\n            id\n            dynamicRemoteAccess {\n                enabledType\n                runningType\n                error\n            }\n        }\n    }\n": types.ConnectStatusDocument,
    "\n    query Services {\n        services {\n            id\n            name\n            online\n            uptime {\n                timestamp\n            }\n            version\n        }\n    }\n": types.ServicesDocument,
};

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
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    mutation UpdateSandboxSettings($input: JSON!) {\n        updateSettings(input: $input) {\n            restartRequired\n            values\n        }\n    }\n"): (typeof documents)["\n    mutation UpdateSandboxSettings($input: JSON!) {\n        updateSettings(input: $input) {\n            restartRequired\n            values\n        }\n    }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    query SystemReport {\n        info {\n            id\n            machineId\n            system {\n                manufacturer\n                model\n                version\n                sku\n                serial\n                uuid\n            }\n            versions {\n                unraid\n                kernel\n                openssl\n            }\n        }\n        config {\n            id\n            valid\n            error\n        }\n        server {\n            id\n            name\n        }\n    }\n"): (typeof documents)["\n    query SystemReport {\n        info {\n            id\n            machineId\n            system {\n                manufacturer\n                model\n                version\n                sku\n                serial\n                uuid\n            }\n            versions {\n                unraid\n                kernel\n                openssl\n            }\n        }\n        config {\n            id\n            valid\n            error\n        }\n        server {\n            id\n            name\n        }\n    }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    query ConnectStatus {\n        connect {\n            id\n            dynamicRemoteAccess {\n                enabledType\n                runningType\n                error\n            }\n        }\n    }\n"): (typeof documents)["\n    query ConnectStatus {\n        connect {\n            id\n            dynamicRemoteAccess {\n                enabledType\n                runningType\n                error\n            }\n        }\n    }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    query Services {\n        services {\n            id\n            name\n            online\n            uptime {\n                timestamp\n            }\n            version\n        }\n    }\n"): (typeof documents)["\n    query Services {\n        services {\n            id\n            name\n            online\n            uptime {\n                timestamp\n            }\n            version\n        }\n    }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;