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
 */
const documents = {
    "\n  query CloudStatus {\n    cloud {\n      ...FragmentCloud\n    }\n  }\n": types.CloudStatusDocument,
    "\n  fragment FragmentCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n": types.FragmentCloudFragmentDoc,
    "\n  fragment FragmentConfig on Config {\n    error\n    valid\n  }\n": types.FragmentConfigFragmentDoc,
    "\n  fragment FragmentOwner on Owner {\n    avatar\n    username\n  }\n": types.FragmentOwnerFragmentDoc,
    "\n  fragment FragmentRegistration on Registration {\n    state\n    expiration\n    keyFile {\n      contents\n    }\n  }\n": types.FragmentRegistrationFragmentDoc,
    "\n  fragment FragmentVars on Vars {\n    regGen\n    regState\n    configError\n    configValid\n  }\n": types.FragmentVarsFragmentDoc,
    "\n  query serverState {\n    cloud {\n      ...FragmentCloud\n    }\n    config {\n      ...FragmentConfig\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      ...FragmentOwner\n    }\n    registration {\n      ...FragmentRegistration\n    }\n    vars {\n      ...FragmentVars\n    }\n  }\n": types.serverStateDocument,
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
export function graphql(source: "\n  query CloudStatus {\n    cloud {\n      ...FragmentCloud\n    }\n  }\n"): (typeof documents)["\n  query CloudStatus {\n    cloud {\n      ...FragmentCloud\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FragmentCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n"): (typeof documents)["\n  fragment FragmentCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FragmentConfig on Config {\n    error\n    valid\n  }\n"): (typeof documents)["\n  fragment FragmentConfig on Config {\n    error\n    valid\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FragmentOwner on Owner {\n    avatar\n    username\n  }\n"): (typeof documents)["\n  fragment FragmentOwner on Owner {\n    avatar\n    username\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FragmentRegistration on Registration {\n    state\n    expiration\n    keyFile {\n      contents\n    }\n  }\n"): (typeof documents)["\n  fragment FragmentRegistration on Registration {\n    state\n    expiration\n    keyFile {\n      contents\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FragmentVars on Vars {\n    regGen\n    regState\n    configError\n    configValid\n  }\n"): (typeof documents)["\n  fragment FragmentVars on Vars {\n    regGen\n    regState\n    configError\n    configValid\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query serverState {\n    cloud {\n      ...FragmentCloud\n    }\n    config {\n      ...FragmentConfig\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      ...FragmentOwner\n    }\n    registration {\n      ...FragmentRegistration\n    }\n    vars {\n      ...FragmentVars\n    }\n  }\n"): (typeof documents)["\n  query serverState {\n    cloud {\n      ...FragmentCloud\n    }\n    config {\n      ...FragmentConfig\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      ...FragmentOwner\n    }\n    registration {\n      ...FragmentRegistration\n    }\n    vars {\n      ...FragmentVars\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;