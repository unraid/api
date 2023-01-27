/* eslint-disable */
import * as Types from '@app/graphql/generated/api/types';

import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type getCloudQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type getCloudQuery = { __typename?: 'Query', cloud?: { __typename?: 'Cloud', error?: string | null, allowedOrigins: Array<string>, apiKey: { __typename?: 'ApiKeyResponse', valid: boolean, error?: string | null }, minigraphql: { __typename?: 'MinigraphqlResponse', status: Types.MinigraphStatus, timeout?: number | null, error?: string | null }, cloud: { __typename?: 'CloudResponse', status: string, error?: string | null, ip?: string | null } } | null };

export type getServersQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type getServersQuery = { __typename?: 'Query', servers: Array<{ __typename?: 'Server', name: string, guid: string, status: Types.Status, owner: { __typename?: 'Owner', username?: string | null } }> };


export const getCloudDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"minigraphql"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"timeout"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"ip"}}]}},{"kind":"Field","name":{"kind":"Name","value":"allowedOrigins"}}]}}]}}]} as unknown as DocumentNode<getCloudQuery, getCloudQueryVariables>;
export const getServersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getServers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"servers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"guid"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}}]}}]}}]}}]} as unknown as DocumentNode<getServersQuery, getServersQueryVariables>;