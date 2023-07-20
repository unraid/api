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
    "\n  fragment TestFragment on Cloud {\n    error\n  }\n": types.TestFragmentFragmentDoc,
    "\n  query cloudError {\n    cloud {\n      ...TestFragment\n    }\n  }\n": types.cloudErrorDocument,
    "\n  fragment FragmentConfig on Config {\n    error\n    valid\n  }\n": types.FragmentConfigFragmentDoc,
    "\n  fragment FragmentOwner on Owner {\n    avatar\n    username\n  }\n": types.FragmentOwnerFragmentDoc,
    "\n  fragment FragmentRegistration on Registration {\n    state\n    expiration\n    keyFile {\n      contents\n    }\n  }\n": types.FragmentRegistrationFragmentDoc,
    "\n  fragment FragmentVars on Vars {\n    regGen\n    regState\n    configError\n    configValid\n  }\n": types.FragmentVarsFragmentDoc,
    "\n  query serverState {\n    owner {\n      ...FragmentOwner\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    registration {\n      ...FragmentRegistration\n    }\n    crashReportingEnabled\n    vars {\n      ...FragmentVars\n    }\n    config {\n      ...FragmentConfig\n    }\n    cloud {\n      error\n      apiKey {\n        valid\n        error\n      }\n      relay {\n        status\n        error\n      }\n      cloud {\n        status\n        error\n      }\n    }\n  }\n": types.serverStateDocument,
    "\n  subscription Config {\n    config {\n      ...FragmentConfig\n    }\n  }\n": types.ConfigDocument,
    "\n  subscription Owner {\n    owner {\n      ...FragmentOwner\n    }\n  }\n": types.OwnerDocument,
    "\n  subscription Registration {\n    registration {\n      ...FragmentRegistration\n    }\n  }\n": types.RegistrationDocument,
    "\n  subscription Vars {\n    vars {\n      ...FragmentVars\n    }\n  }\n": types.VarsDocument,
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
export function graphql(source: "\n  fragment TestFragment on Cloud {\n    error\n  }\n"): (typeof documents)["\n  fragment TestFragment on Cloud {\n    error\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query cloudError {\n    cloud {\n      ...TestFragment\n    }\n  }\n"): (typeof documents)["\n  query cloudError {\n    cloud {\n      ...TestFragment\n    }\n  }\n"];
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
export function graphql(source: "\n  query serverState {\n    owner {\n      ...FragmentOwner\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    registration {\n      ...FragmentRegistration\n    }\n    crashReportingEnabled\n    vars {\n      ...FragmentVars\n    }\n    config {\n      ...FragmentConfig\n    }\n    cloud {\n      error\n      apiKey {\n        valid\n        error\n      }\n      relay {\n        status\n        error\n      }\n      cloud {\n        status\n        error\n      }\n    }\n  }\n"): (typeof documents)["\n  query serverState {\n    owner {\n      ...FragmentOwner\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    registration {\n      ...FragmentRegistration\n    }\n    crashReportingEnabled\n    vars {\n      ...FragmentVars\n    }\n    config {\n      ...FragmentConfig\n    }\n    cloud {\n      error\n      apiKey {\n        valid\n        error\n      }\n      relay {\n        status\n        error\n      }\n      cloud {\n        status\n        error\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription Config {\n    config {\n      ...FragmentConfig\n    }\n  }\n"): (typeof documents)["\n  subscription Config {\n    config {\n      ...FragmentConfig\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription Owner {\n    owner {\n      ...FragmentOwner\n    }\n  }\n"): (typeof documents)["\n  subscription Owner {\n    owner {\n      ...FragmentOwner\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription Registration {\n    registration {\n      ...FragmentRegistration\n    }\n  }\n"): (typeof documents)["\n  subscription Registration {\n    registration {\n      ...FragmentRegistration\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription Vars {\n    vars {\n      ...FragmentVars\n    }\n  }\n"): (typeof documents)["\n  subscription Vars {\n    vars {\n      ...FragmentVars\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;