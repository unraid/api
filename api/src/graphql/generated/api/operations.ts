/* eslint-disable */
import * as Types from '@app/graphql/generated/api/types';

import { z } from 'zod'
import { ArrayDiskFsColor, ArrayDiskStatus, ArrayDiskType, ArrayPendingState, ArrayState, ConfigErrorState, ContainerPortType, ContainerState, DiskFsType, DiskInterfaceType, DiskSmartStatus, Importance, MemoryFormFactor, MemoryType, MinigraphStatus, NotificationFilter, NotificationInput, NotificationType, RegistrationState, ServerStatus, Temperature, Theme, VmState, addApiKeyInput, addScopeInput, addScopeToApiKeyInput, addUserInput, arrayDiskInput, authenticateInput, deleteUserInput, mdState, registrationType, testMutationInput, testQueryInput, updateApikeyInput, usersInput } from '@app/graphql/generated/api/types'
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K], any, T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny => v !== undefined && v !== null;

export const definedNonNullAnySchema = z.any().refine((v) => isDefinedNonNullAny(v));

export const ArrayDiskFsColorSchema = z.nativeEnum(ArrayDiskFsColor);

export const ArrayDiskStatusSchema = z.nativeEnum(ArrayDiskStatus);

export const ArrayDiskTypeSchema = z.nativeEnum(ArrayDiskType);

export const ArrayPendingStateSchema = z.nativeEnum(ArrayPendingState);

export const ArrayStateSchema = z.nativeEnum(ArrayState);

export const ConfigErrorStateSchema = z.nativeEnum(ConfigErrorState);

export const ContainerPortTypeSchema = z.nativeEnum(ContainerPortType);

export const ContainerStateSchema = z.nativeEnum(ContainerState);

export const DiskFsTypeSchema = z.nativeEnum(DiskFsType);

export const DiskInterfaceTypeSchema = z.nativeEnum(DiskInterfaceType);

export const DiskSmartStatusSchema = z.nativeEnum(DiskSmartStatus);

export const ImportanceSchema = z.nativeEnum(Importance);

export const MemoryFormFactorSchema = z.nativeEnum(MemoryFormFactor);

export const MemoryTypeSchema = z.nativeEnum(MemoryType);

export const MinigraphStatusSchema = z.nativeEnum(MinigraphStatus);

export function NotificationFilterSchema(): z.ZodObject<Properties<NotificationFilter>> {
  return z.object<Properties<NotificationFilter>>({
    importance: ImportanceSchema.nullish()
  })
}

export function NotificationInputSchema(): z.ZodObject<Properties<NotificationInput>> {
  return z.object<Properties<NotificationInput>>({
    description: z.string().nullish(),
    importance: ImportanceSchema,
    link: z.string().nullish(),
    subject: z.string(),
    timestamp: z.string(),
    title: z.string(),
    type: NotificationTypeSchema
  })
}

export const NotificationTypeSchema = z.nativeEnum(NotificationType);

export const RegistrationStateSchema = z.nativeEnum(RegistrationState);

export const ServerStatusSchema = z.nativeEnum(ServerStatus);

export const TemperatureSchema = z.nativeEnum(Temperature);

export const ThemeSchema = z.nativeEnum(Theme);

export const VmStateSchema = z.nativeEnum(VmState);

export function addApiKeyInputSchema(): z.ZodObject<Properties<addApiKeyInput>> {
  return z.object<Properties<addApiKeyInput>>({
    key: z.string().nullish(),
    name: z.string().nullish(),
    userId: z.string().nullish()
  })
}

export function addScopeInputSchema(): z.ZodObject<Properties<addScopeInput>> {
  return z.object<Properties<addScopeInput>>({
    description: z.string().nullish(),
    name: z.string()
  })
}

export function addScopeToApiKeyInputSchema(): z.ZodObject<Properties<addScopeToApiKeyInput>> {
  return z.object<Properties<addScopeToApiKeyInput>>({
    apiKey: z.string(),
    name: z.string()
  })
}

export function addUserInputSchema(): z.ZodObject<Properties<addUserInput>> {
  return z.object<Properties<addUserInput>>({
    description: z.string().nullish(),
    name: z.string(),
    password: z.string()
  })
}

export function arrayDiskInputSchema(): z.ZodObject<Properties<arrayDiskInput>> {
  return z.object<Properties<arrayDiskInput>>({
    id: z.string(),
    slot: z.number().nullish()
  })
}

export function authenticateInputSchema(): z.ZodObject<Properties<authenticateInput>> {
  return z.object<Properties<authenticateInput>>({
    password: z.string()
  })
}

export function deleteUserInputSchema(): z.ZodObject<Properties<deleteUserInput>> {
  return z.object<Properties<deleteUserInput>>({
    name: z.string()
  })
}

export const mdStateSchema = z.nativeEnum(mdState);

export const registrationTypeSchema = z.nativeEnum(registrationType);

export function testMutationInputSchema(): z.ZodObject<Properties<testMutationInput>> {
  return z.object<Properties<testMutationInput>>({
    state: z.string()
  })
}

export function testQueryInputSchema(): z.ZodObject<Properties<testQueryInput>> {
  return z.object<Properties<testQueryInput>>({
    optional: z.boolean().nullish(),
    state: z.string()
  })
}

export function updateApikeyInputSchema(): z.ZodObject<Properties<updateApikeyInput>> {
  return z.object<Properties<updateApikeyInput>>({
    description: z.string().nullish(),
    expiresAt: z.number()
  })
}

export function usersInputSchema(): z.ZodObject<Properties<usersInput>> {
  return z.object<Properties<usersInput>>({
    slim: z.boolean().nullish()
  })
}

export type getCloudQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type getCloudQuery = { __typename?: 'Query', cloud?: { __typename?: 'Cloud', error?: string | null, allowedOrigins: Array<string>, apiKey: { __typename?: 'ApiKeyResponse', valid: boolean, error?: string | null }, minigraphql: { __typename?: 'MinigraphqlResponse', status: Types.MinigraphStatus, timeout?: number | null, error?: string | null }, cloud: { __typename?: 'CloudResponse', status: string, error?: string | null, ip?: string | null } } | null };

export type getServersQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type getServersQuery = { __typename?: 'Query', servers: Array<{ __typename?: 'Server', name: string, guid: string, status: Types.ServerStatus, owner: { __typename?: 'ProfileModel', username?: string | null } }> };


export const getCloudDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"minigraphql"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"timeout"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"ip"}}]}},{"kind":"Field","name":{"kind":"Name","value":"allowedOrigins"}}]}}]}}]} as unknown as DocumentNode<getCloudQuery, getCloudQueryVariables>;
export const getServersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getServers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"servers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"guid"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}}]}}]}}]}}]} as unknown as DocumentNode<getServersQuery, getServersQueryVariables>;